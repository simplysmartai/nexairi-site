import 'dotenv/config';
import dotenv from 'dotenv';

// Load .env.local if present (local overrides for development)
dotenv.config({ path: '.env.local', override: false });

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import OpenAI from 'openai';
import { perplexity } from '@ai-sdk/perplexity';
import { GoogleGenAI } from '@google/genai';
import { FALLBACK_POST_IMAGE } from '../constants/media.ts';
import { enforceAffiliateCompliance } from '../utils/affiliate.ts';

const REQUIRED_ENV = ['OPENAI_API_KEY'] as const;
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const createPerplexityClient = perplexity as unknown as (config: { apiKey: string }) => any;
const perplexityClient = process.env.PERPLEXITY_API_KEY
  ? createPerplexityClient({ apiKey: process.env.PERPLEXITY_API_KEY })
  : null;
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const GENRE_PROFILES = {
  lifestyle: {
    author: 'Nexairi Lifestyle',
    tone: 'calm, design-forward, practical empathy',
    tags: ['lifestyle', 'rituals', 'calm'],
    category: 'Lifestyle',
    fallbackImage: FALLBACK_POST_IMAGE,
  },
  technology: {
    author: 'Nexairi Technology',
    tone: 'analytical, systems-minded, quietly ambitious',
    tags: ['technology', 'ai', 'systems'],
    category: 'Technology',
    fallbackImage: FALLBACK_POST_IMAGE,
  },
  travel: {
    author: 'Nexairi Travel',
    tone: 'sensory detail, logistics clarity, modern nomad',
    tags: ['travel', 'mobility', 'cities'],
    category: 'Travel',
    fallbackImage: FALLBACK_POST_IMAGE,
  },
  sports: {
    author: 'Nexairi Sports Lab',
    tone: 'performance-first, human + algorithmic edge',
    tags: ['sports', 'performance', 'analysis'],
    category: 'Sports',
    fallbackImage: FALLBACK_POST_IMAGE,
  },
} as const;

const DEFAULT_GENRE = 'technology';
export type GenreKey = keyof typeof GENRE_PROFILES;
export const GENRE_KEYS = Object.keys(GENRE_PROFILES) as GenreKey[];

export interface GenerateOptions {
  topic?: string;
  genre?: GenreKey;
  quiet?: boolean;
  research?: string | null;
  dryRun?: boolean;
  skipImages?: boolean;
}

interface DraftPayload {
  frontmatter: {
    title: string;
    slug?: string;
    summary: string;
    tags: string[];
    category?: string;
    excerpt?: string;
    imageUrl?: string;
    isFeatured?: boolean;
    metaDescription?: string;
    heroAlt?: string;
    heroCredit?: string;
    imagePrompt?: string;
    affiliateDisclosure?: boolean;
  };
  html: string;
}

interface MetaPayload {
  metaDescription: string;
  heroAlt: string;
  imagePrompt: string;
}

interface CopyReviewPayload {
  html: string;
  notes?: string[];
  warnings?: string[];
}

interface ImageSuggestion {
  imageUrl: string;
  alt: string;
  credit?: string;
  prompt?: string;
}


function parseArgs(): { topic?: string; genre: GenreKey; researchFile?: string; dryRun: boolean; skipImages: boolean } {
  const args = process.argv.slice(2);
  let topic: string | undefined;
  let genre: GenreKey = DEFAULT_GENRE;
  let researchFile: string | undefined;
  let dryRun = false;
  let skipImages = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--topic' && args[i + 1]) {
      topic = args[i + 1];
      i += 1;
    } else if (arg === '--genre' && args[i + 1]) {
      const candidate = args[i + 1].toLowerCase();
      if (candidate in GENRE_PROFILES) {
        genre = candidate as GenreKey;
      }
      i += 1;
    } else if (!arg.startsWith('--') && !topic) {
      topic = arg;
    }
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--research-file' && args[i + 1]) {
      researchFile = args[i + 1];
      i += 1;
    }
    if (arg === '--dry-run') {
      dryRun = true;
    }
    if (arg === '--skip-images') {
      skipImages = true;
    }
  }

  return { topic, genre, researchFile, dryRun, skipImages };
}

async function pickTopic(genre: GenreKey): Promise<string> {
  console.log(`🧠 Selecting topic for ${genre}…`);
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: 'You propose a single timely, high-signal article topic for the Nexairi magazine.',
      },
      {
        role: 'user',
        content: `Genre: ${genre}. Return only the topic title, no explanation. Focus on emerging signals relevant this week.`,
      },
    ],
  });
  const topic = completion.choices[0].message?.content?.trim();
  if (!topic) {
    throw new Error('Failed to propose a topic');
  }
  console.log(`   → Topic: ${topic}`);
  return topic;
}

async function researchTopic(topic: string, genre: GenreKey): Promise<string | null> {
  if (!perplexityClient) {
    console.log('⚠️  Skipping research (PERPLEXITY_API_KEY missing).');
    return null;
  }

  console.log('🔎 Gathering research via Perplexity (attempting multiple SDK methods)…');
  const client: any = perplexityClient;
  try {
    const keys = Object.keys(client).filter(Boolean);
    console.log('   → Perplexity client available methods:', keys.join(', '));
  } catch (err) {
    // ignore
  }
  const prompt = `Produce bulletproof research for the topic "${topic}" in the ${genre} category.\nReturn bullet points with references, stats, and contrasting viewpoints.`;
  const candidates = [
    { name: 'generateText', call: async () => client.generateText({ model: 'llama-3.1-sonar-large-128k-online', prompt, maxTokens: 1200 }) },
    { name: 'generate', call: async () => client.generate?.(prompt) },
    { name: 'ask', call: async () => client.ask?.(prompt) },
    { name: 'query', call: async () => client.query?.(prompt) },
    { name: 'search', call: async () => client.search?.(prompt) },
  ];

  for (const c of candidates) {
    try {
      if (typeof c.call !== 'function') continue;
      const res = await c.call();
      // normalize different response shapes
      if (!res) continue;
      if (typeof res === 'string') {
        console.log(`   → Perplexity method ${c.name} returned string response`);
        return res;
      }
      if (res.text) {
        const txt = typeof res.text === 'function' ? await res.text() : res.text;
        if (txt) {
          console.log(`   → Perplexity method ${c.name} returned text`);
          return txt;
        }
      }
      if (res.data && typeof res.data === 'string') {
        console.log(`   → Perplexity method ${c.name} returned data`);
        return res.data;
      }
      // some SDKs return { output: { text: '...' } }
      if (res.output && res.output.text) {
        console.log(`   → Perplexity method ${c.name} returned output.text`);
        return res.output.text;
      }
    } catch (err) {
      console.warn(`   ⚠️ Perplexity method ${c.name} failed:`, err?.message || err);
      continue;
    }
  }

  console.log('⚠️  All Perplexity method attempts failed or returned no usable text.');
  return null;
}

function buildSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'untitled-post';
}

async function draftArticle(topic: string, genre: GenreKey, research: string | null): Promise<DraftPayload> {
  console.log('✍️  Drafting article with OpenAI…');
  const profile = GENRE_PROFILES[genre];

  const messages: any[] = [
    {
      role: 'system',
      content: `You are Nexairi's editorial AI. Tone: ${profile.tone}. Output JSON with keys frontmatter + html. frontmatter must include title, slug, summary (<=160 chars), tags array (3-6, lowercase). HTML must be semantic (<article>, <section>, etc.).`,
    },
  ];

  // base payload
  messages.push({ role: 'user', content: JSON.stringify({ topic, genre, research }) });

  const lower = topic.toLowerCase();
  
  // Support strict weekly recap prompts for major sports (NBA, NHL, MLS, MLB later)
  const sportMatch = lower.includes('nba')
    ? 'NBA'
    : lower.includes('nhl')
    ? 'NHL'
    : lower.includes('mls')
    ? 'MLS'
    : lower.includes('mlb')
    ? 'MLB'
    : null;

  if ((lower.includes('weekly') || lower.includes('weekly recap') || lower.includes('recap')) && sportMatch) {
    if (!research) {
      throw new Error(`Perplexity research is required for weekly ${sportMatch} recaps. Set PERPLEXITY_API_KEY and retry.`);
    }

    const recapPromptSport = `You are the lead ${sportMatch} writer for Nexairi Mentis producing an ESPN-quality weekly recap. Use ONLY the research provided (do not hallucinate). Research material follows (VERBATIM):\n\n${research}\n\nINSTRUCTIONS:\n1) Identify the week covered by the research: find the first day and last day of the regular-season week referenced, and use those as [START DATE] and [END DATE]. If you cannot verify up-to-date results for this exact week, STOP and return a JSON object with a single key \\"error\\": "insufficient_research". Do NOT guess.\n2) Collect 8–12 final scores (date, home team, away team, final score) that occurred between [START DATE] and [END DATE].\n3) Collect current records for teams you mention and key box-score lines for at least 5 standout performances.\n4) List 3–5 notable storylines (injuries, trades, rotation changes, coaching moves) with sources from the research.\n\nOUTPUT: Return ONE JSON object exactly matching the schema below. All fields are required unless noted. Fields that contain HTML must be valid (escape as needed) and the \"contentHtml\" field must be a single HTML string containing the sections described.\n\nJSON SCHEMA (example structure):\n{\n  \"id\": \"YYYY-MM-DD-${sportMatch.toLowerCase()}-weekly-recap\",\n  \"title\": \"Weekly ${sportMatch} Recap: Week of [END DATE]\",\n  \"slug\": \"${sportMatch.toLowerCase()}-week-recap-[end-date-kebab]\",\n  \"category\": \"Sports & Seasons\",\n  \"subCategory\": \"${sportMatch}\",\n  \"league\": \"${sportMatch}\",\n  \"contentType\": \"weekly-recap\",\n  \"seasonContext\": \"Regular season, week covering [START DATE] to [END DATE] of the [SEASON YEAR] season.\",\n  \"tldr\": \"2–3 sentence summary with concrete facts (scores, injuries).\",\n  \"persona\": \"Busy ${sportMatch} fan who wants one smart weekly catch-up.\",\n  \"angle\": \"1–2 sentence thesis referencing standings or trends.\",\n  \"date\": \"TODAY in YYYY-MM-DD (UTC)\",\n  \"readingTime\": 8,\n  \"imageUrl\": \"/images/sports/${sportMatch.toLowerCase()}-week-[end-date].jpg\",\n  \"tags\": [\"sports\",\"${sportMatch}\",\"weekly recap\",\"[SEASON YEAR]\"],\n  \"contentPath\": \"/content/sports/${sportMatch.toLowerCase()}-weekly-recap-[end-date-kebab].html\",\n  \"contentHtml\": \"<HTML string matching required sections>\"\n}\n\nCONTENT HTML REQUIREMENTS:\n- <h1> the title. Intro: 2 paragraphs with thesis and date range.\n- Sections: 'The week at a glance', 'Statement wins and bad losses' (4–6 bullets with date/matchup/score/records), 'Players who shifted the landscape' (4–6 players with 1–2 game stat lines each), 'Injuries and storylines to monitor' (3–5 items with expected impact), 'Standings snapshot' (two tables: East and West top 5 with records and a short note) if applicable to the sport, 'What to watch next week' (5 upcoming games with dates/networks and why).\n- Every paragraph must include at least one concrete detail (score, record, date, stat, or named storyline).\n\nIf you can comply, return the JSON object. If you cannot (insufficient research), return { \"error\": \"insufficient_research\" }. Do NOT output any prose outside the JSON.\n`;

    messages.push({ role: 'user', content: recapPromptSport });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.55,
    messages,
  });

  const raw = completion.choices[0].message?.content;
  if (!raw) {
    throw new Error('OpenAI returned empty response.');
  }

  const payload = JSON.parse(raw) as any;

  // If the recap agent couldn't verify research, abort early.
  if (payload && payload.error === 'insufficient_research') {
    throw new Error('Insufficient research to produce a weekly recap. Aborting.');
  }

  // If the payload follows the site's DraftPayload shape (frontmatter + html), use it directly.
  if (payload && payload.frontmatter && payload.html) {
    const parsed = payload as DraftPayload;
    const title = parsed.frontmatter.title?.trim();
    if (!title || !parsed.html) throw new Error('Draft payload missing title or html.');

    const slug = buildSlug(parsed.frontmatter.slug || title);
    parsed.frontmatter.slug = slug;
    parsed.frontmatter.summary = parsed.frontmatter.summary?.slice(0, 160) ?? '';
    parsed.frontmatter.tags = parsed.frontmatter.tags?.map((tag) => tag.toLowerCase()) ?? [...profile.tags];
    parsed.frontmatter.category = parsed.frontmatter.category || profile.category;
    parsed.frontmatter.excerpt =
      parsed.frontmatter.summary ||
      stripHtml(extractPreviewHtml(parsed.html)).slice(0, 200) ||
      'High-signal intelligence dispatch.';
    parsed.frontmatter.imageUrl = parsed.frontmatter.imageUrl || profile.fallbackImage;
    return parsed;
  }

  // If the payload matches the NBA weekly recap schema (top-level fields), map it into DraftPayload
  if (payload && payload.contentHtml && payload.title) {
    const title = String(payload.title).trim();
    const slug = buildSlug(payload.slug || title);
    const front: DraftPayload['frontmatter'] = {
      title,
      slug,
      summary: String(payload.tldr || '').slice(0, 160),
      tags: Array.isArray(payload.tags) && payload.tags.length ? payload.tags.map((t: string) => t.toLowerCase()) : [...profile.tags],
      category: payload.category || profile.category || 'Sports & Seasons',
      imageUrl: payload.imageUrl || profile.fallbackImage,
    };

    const html = String(payload.contentHtml);
    const result: DraftPayload = { frontmatter: front, html };
    // ensure excerpt
    result.frontmatter.excerpt = result.frontmatter.summary || stripHtml(extractPreviewHtml(html)).slice(0, 200) || 'High-signal intelligence dispatch.';
    return result;
  }

  throw new Error('Unexpected response format from OpenAI for draftArticle.');
}

async function runCopyReviewAgent(
  topic: string,
  genre: GenreKey,
  html: string,
): Promise<CopyReviewPayload | null> {
  console.log('🕵️  Running copy-review agent…');
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            "You are Nexairi's executive editor. Polish the article HTML without removing structure, tighten language, enforce tone guidelines, call out missing disclosures, and respond with JSON keys html, notes, warnings.",
        },
        {
          role: 'user',
          content: JSON.stringify({ topic, genre, html }),
        },
      ],
    });

    const payload = completion.choices[0].message?.content;
    if (!payload) return null;
    const parsed = JSON.parse(payload) as CopyReviewPayload;
    if (!parsed.html) return null;
    const notes = Array.isArray(parsed.notes)
      ? parsed.notes
      : parsed.notes
        ? [parsed.notes]
        : [];
    if (notes.length) {
      console.log(`   → Copy review notes: ${notes.join(' | ')}`);
    }
    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings
      : parsed.warnings
        ? [parsed.warnings]
        : [];
    warnings.forEach((warning) => console.warn(`   ⚠️  Copy review warning: ${warning}`));
    return parsed;
  } catch (error) {
    console.warn('Copy-review agent failed, using draft HTML.', error);
    return null;
  }
}

function extractPreviewHtml(html: string): string {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  return articleMatch ? articleMatch[1] : html;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function buildMetaAssets(topic: string, html: string): Promise<MetaPayload | null> {
  if (!geminiClient) {
    console.log('⚠️  Skipping Gemini meta layer (GEMINI_API_KEY missing).');
    return null;
  }

  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  console.log(`🎨 Requesting Gemini meta + imagery guidance (model: ${GEMINI_MODEL})…`);
  const prompt = `Create metadata for Nexairi article. Return JSON with keys: metaDescription (<=155 chars), heroAlt, imagePrompt (stable diffusion style). Topic: ${topic} Preview HTML: ${html.slice(0, 2000)}`;

  try {
    const response = await (geminiClient as any).models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = (response as any).text?.() ?? (response as any).text;
    if (!text) return null;
    try {
      const meta = JSON.parse(text) as MetaPayload;
      return meta;
    } catch (error) {
      console.warn('Gemini meta payload parse failed:', error);
      return null;
    }
  } catch (err: any) {
    // Bubble up the error to caller which already handles failures, but log actionable guidance
    if (err?.status === 404 || (err?.error && err.error.status === 404)) {
      console.warn('⚠️  Gemini model not found (404). Try setting `GEMINI_MODEL` to an available model or remove the GEMINI_API_KEY.');
    } else {
      console.warn('⚠️  Gemini meta request failed:', err?.message || err);
    }
    throw err;
  }
}

function buildImageProxyUrl(keywords: string[], genre: GenreKey): string {
  const query = keywords.length ? keywords.join(',') : genre;
  return `https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`;
}

async function suggestHeroImage(topic: string, genre: GenreKey, html: string): Promise<ImageSuggestion | null> {
  console.log('🖼️  Requesting image-sourcing agent guidance…');
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are Nexairi\'s visual editor. Recommend a single hero image concept with alt text and style keywords in JSON (keys: alt, credit, prompt, styleKeywords, imageUrl). Prefer modern editorial photography.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            topic,
            genre,
            excerpt: stripHtml(extractPreviewHtml(html)).slice(0, 400),
          }),
        },
      ],
    });

    const payload = completion.choices[0].message?.content;
    if (!payload) return null;
    const parsed = JSON.parse(payload) as {
      alt?: string;
      credit?: string;
      prompt?: string;
      styleKeywords?: string[];
      imageUrl?: string;
    };

    const keywords = Array.isArray(parsed.styleKeywords) ? parsed.styleKeywords.filter(Boolean) : [];
    const imageUrl = parsed.imageUrl || buildImageProxyUrl(keywords, genre);
    const alt = parsed.alt?.trim() || `${topic} — ${genre} visual.`;
    return {
      imageUrl,
      alt,
      credit: parsed.credit?.trim(),
      prompt: parsed.prompt?.trim() || keywords.join(', '),
    };
  } catch (error) {
    console.warn('Image-sourcing agent failed, falling back to default artwork.', error);
    return null;
  }
}

function logAffiliateCompliance(affiliateLinks: number, disclosureInserted: boolean): void {
  if (disclosureInserted) {
    console.log('ℹ️  Affiliate disclosure appended to article.');
  }
  if (affiliateLinks > 0) {
    console.log(`ℹ️  Normalized ${affiliateLinks} Amazon link(s) with tracking tag.`);
  }
}

function serializeFrontmatter(frontmatter: Record<string, string | string[] | boolean>) {
  const lines: string[] = ['---'];
  Object.entries(frontmatter).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      lines.push(`${key}:`);
      value.forEach((item) => lines.push(`  - "${item}"`));
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    }
  });
  lines.push('---');
  return lines.join('\n');
}

async function persistArticle(frontmatter: DraftPayload['frontmatter'], html: string, meta?: MetaPayload | null) {
  const genreProfile = Object.values(GENRE_PROFILES).find((profile) => {
    const profileTags = [...profile.tags];
    return profileTags.some((tag) => frontmatter.tags.includes(tag));
  });
  const heroAlt = frontmatter.heroAlt || meta?.heroAlt;
  const heroCredit = frontmatter.heroCredit;
  const imagePrompt = frontmatter.imagePrompt || meta?.imagePrompt;
  const metaDescription = frontmatter.metaDescription || meta?.metaDescription;

  const fm = {
    title: frontmatter.title,
    slug: frontmatter.slug!,
    date: new Date().toISOString(),
    author: genreProfile?.author || 'Nexairi Editorial',
    summary: frontmatter.summary || 'High-signal intelligence.',
    excerpt: frontmatter.excerpt || frontmatter.summary || 'High-signal intelligence dispatch.',
    category: frontmatter.category || genreProfile?.category || 'Lifestyle',
    tags: frontmatter.tags,
    imageUrl: frontmatter.imageUrl || FALLBACK_POST_IMAGE,
    isFeatured: frontmatter.isFeatured ?? false,
    ...(metaDescription ? { metaDescription } : {}),
    ...(heroAlt ? { heroAlt } : {}),
    ...(heroCredit ? { heroCredit } : {}),
    ...(imagePrompt ? { imagePrompt } : {}),
    ...(frontmatter.affiliateDisclosure ? { affiliateDisclosure: true } : {}),
  };

  const output = `${serializeFrontmatter(fm)}\n\n${html.trim()}\n`;
  const folder = String(fm.category || 'uncategorized').toLowerCase().replace(/\s+/g, '-');
  const filename = `${fm.slug}.html`;
  const outDir = path.resolve('public', 'content', folder);
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.resolve(outDir, filename);
  await fs.writeFile(outPath, output, 'utf8');
  console.log(`✅ Saved article → public/content/${folder}/${filename}`);
}

function validateDraftForPersistence(front: DraftPayload['frontmatter'], html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!front.title || !front.title.trim()) errors.push('missing title');
  if (!front.slug || !front.slug.trim()) errors.push('missing slug');
  if (!front.summary || front.summary.trim().length < 20) errors.push('summary is too short (<20 chars)');
  if (!front.tags || !Array.isArray(front.tags) || front.tags.length === 0) errors.push('tags missing');
  const plain = stripHtml(html || '');
  if (!plain || plain.length < 500) errors.push('content body too short (<500 characters)');
  // If this looks like a weekly recap, require a longer minimum
  const isWeekly = (front.slug && /week|weekly|recap/i.test(front.slug)) || (front.tags && front.tags.some((t) => /week|weekly|recap/i.test(String(t))));
  if (isWeekly && plain.length < 1800) errors.push('weekly recap appears too short (<1800 characters)');
  return { valid: errors.length === 0, errors };
}

async function writeDiagnostic(slug: string, obj: Record<string, any>): Promise<string> {
  try {
    const reportsDir = path.resolve('reports', 'generate');
    await fs.mkdir(reportsDir, { recursive: true });
    const filename = `${slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}-diagnostic.json`;
    const out = path.resolve(reportsDir, filename);
    await fs.writeFile(out, JSON.stringify(obj, null, 2) + '\n', 'utf8');
    return out;
  } catch (err) {
    console.warn('Could not write diagnostic file:', err);
    return 'reports/generate (write-failed)';
  }
}

async function runUpdateIndex(): Promise<void> {
  try {
    await import('./updatePostsIndex');
    console.log('🗂️  posts.json updated.');
  } catch (error) {
    console.warn('Could not refresh posts index automatically:', error);
  }
}

async function main() {
  const { topic: topicInput, genre, researchFile, dryRun, skipImages } = parseArgs();
  let researchText: string | undefined;
  if (researchFile) {
    try {
      researchText = await fs.readFile(path.resolve(researchFile), 'utf8');
      console.log(`🔣 Loaded research from ${researchFile}`);
    } catch (err) {
      console.warn(`Could not read research file ${researchFile}:`, err);
    }
  }
  await runGeneratePost({ topic: topicInput, genre, research: researchText ?? null, dryRun, skipImages });
}

export async function runGeneratePost(options: GenerateOptions = {}) {
  const genre = options.genre ?? DEFAULT_GENRE;
  const topic = options.topic ?? (await pickTopic(genre));
  const research = options.research ?? (await researchTopic(topic, genre));
  const draft = await draftArticle(topic, genre, research);
  const review = await runCopyReviewAgent(topic, genre, draft.html);
  const reviewedHtml = review?.html?.trim() || draft.html;
  const compliance = enforceAffiliateCompliance(reviewedHtml);
  logAffiliateCompliance(compliance.affiliateLinks, compliance.disclosureInserted);
  if (compliance.affiliateLinks > 0) {
    draft.frontmatter.affiliateDisclosure = true;
  }
  let imageSuggestion: ImageSuggestion | null = null;
  if (!options.skipImages) {
    imageSuggestion = await suggestHeroImage(topic, genre, compliance.html);
    if (imageSuggestion?.imageUrl) {
      draft.frontmatter.imageUrl = imageSuggestion.imageUrl;
    }
  } else {
    console.log('⚠️  Skipping image-sourcing due to --skip-images flag.');
  }

  let meta: MetaPayload | null = null;
  try {
    meta = await buildMetaAssets(topic, compliance.html);
  } catch (err) {
    console.warn('⚠️  Gemini/meta assets failed — continuing without meta:', err);
    meta = null;
  }
  if (imageSuggestion?.alt) {
    draft.frontmatter.heroAlt = imageSuggestion.alt;
  }
  if (imageSuggestion?.prompt) {
    draft.frontmatter.imagePrompt = imageSuggestion.prompt;
  }
  if (imageSuggestion?.credit) {
    draft.frontmatter.heroCredit = imageSuggestion.credit;
  }
  // Validate draft before persisting to avoid broken posts and wasted pushes
  const validation = validateDraftForPersistence(draft.frontmatter, compliance.html);
  if (!validation.valid) {
    const diagPath = await writeDiagnostic(draft.frontmatter.slug || 'untitled', {
      errors: validation.errors,
      frontmatter: draft.frontmatter,
      preview: stripHtml(extractPreviewHtml(compliance.html)).slice(0, 1000),
      timestamp: new Date().toISOString(),
    });
    console.error('✖️  Draft failed validation. Diagnostic written to', diagPath);
    if (options.dryRun) {
      console.log('ℹ️  Dry-run mode - not writing article. Exiting with non-zero code.');
      throw new Error('Validation failed (dry-run)');
    }
    throw new Error('Draft validation failed: ' + validation.errors.join('; '));
  }

  if (options.dryRun) {
    console.log(`ℹ️  Dry-run: draft validated and would be written to public/content/<category>/${draft.frontmatter.slug}.html`);
  } else {
    await persistArticle(draft.frontmatter, compliance.html, meta);
    await runUpdateIndex();
  }
  if (!options.quiet) {
    console.log('🎯 Next steps: npm run validate-posts && git status');
  }
  return {
    slug: draft.frontmatter.slug!,
    topic,
    genre,
  };
}

const invokedAsScript = (() => {
  if (typeof process.argv[1] !== 'string') return false;
  try {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch (error) {
    console.warn('Could not determine invocation mode:', error);
    return false;
  }
})();

if (invokedAsScript) {
  main().catch((error) => {
    console.error('generatePost failed:', error);
    process.exit(1);
  });
}
