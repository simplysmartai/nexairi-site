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


function parseArgs(): { topic?: string; genre: GenreKey } {
  const args = process.argv.slice(2);
  let topic: string | undefined;
  let genre: GenreKey = DEFAULT_GENRE;

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

  return { topic, genre };
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
  if (typeof (perplexityClient as any).generateText !== 'function') {
    console.log('⚠️  Skipping research (Perplexity SDK missing generateText).');
    return null;
  }

  console.log('🔎 Gathering research via Perplexity…');
  const { text } = await (perplexityClient as any).generateText({
    model: 'llama-3.1-sonar-large-128k-online',
    prompt: `Produce bulletproof research for the topic "${topic}" in the ${genre} category.
Return bullet points with references, stats, and contrasting viewpoints.`,
    maxTokens: 1200,
  });
  return text ?? null;
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
  if (lower.includes('weekly nba recap') || lower.includes('nba recap')) {
    messages.push({
      role: 'user',
      content:
        'This is a WEEKLY RECAP for the NBA. Return the article HTML following this exact H2 structure: <h2>The week in one glance</h2>, <h2>Statement wins and bad losses</h2>, <h2>Players and trends that moved the needle</h2>, <h2>Injuries and stories to monitor</h2>, <h2>What smart fans should watch next week</h2>. Additionally include the following sections (use exact IDs): a section with id="top-10-games" containing an ordered list (<ol>) of the Top 10 games of the week with 2-3 sentence micro-recaps for each game; a section with id="hot-players" containing an ordered list (<ol>) of Top 5 players currently on a hot streak (scoring), each with a 1-2 sentence rationale; a section with id="upcoming-top-5" listing Top 5 games to watch next week (with a short reason); and a section id="conference-standings" with a simple table (conference, team, record, position) listing current conference standings. Keep paragraphs short (2–4 sentences). Do not invent exact scores—use research where available. Ensure the full article is no more than 4000 words. Embed AI image placeholders where useful: include <img data-ai-prompt="..." alt="..."> inside or above the hero and each listed item where appropriate; prefer one hero image and images for the Top 5 players and Top 5 upcoming games sections. Output must remain JSON with keys frontmatter + html.'
    });
  }
  if (lower.includes('weekly nhl recap') || lower.includes('nhl recap')) {
    messages.push({
      role: 'user',
      content:
        'This is a WEEKLY RECAP for the NHL. Return the article HTML following this exact H2 structure: <h2>The week in one glance</h2>, <h2>Statement wins and bad losses</h2>, <h2>Players and trends that moved the needle</h2>, <h2>Injuries and stories to monitor</h2>, <h2>What smart fans should watch next week</h2>. Additionally include the following sections (use exact IDs): a section with id="top-10-games" containing an ordered list (<ol>) of the Top 10 games of the week with 2-3 sentence micro-recaps for each game; a section with id="hot-players" containing an ordered list (<ol>) of Top 5 players currently on a hot streak (scoring), each with a 1-2 sentence rationale; a section with id="upcoming-top-5" listing Top 5 games to watch next week (with a short reason); and a section id="conference-standings" with a simple table (conference, team, record, position) listing current conference standings. Keep paragraphs short (2–4 sentences). Use available research for specific names/stats. Ensure the full article is no more than 4000 words. Embed AI image placeholders where useful: include <img data-ai-prompt="..." alt="..."> inside or above the hero and each listed item where appropriate; prefer one hero image and images for the Top 5 players and Top 5 upcoming games sections. Output must remain JSON with keys frontmatter + html.'
    });
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

  const parsed = JSON.parse(raw) as DraftPayload;
  const title = parsed.frontmatter.title?.trim();
  if (!title || !parsed.html) {
    throw new Error('Draft payload missing title or html.');
  }

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
  const filename = `${fm.slug}.html`;
  const outPath = path.resolve('public', 'content', filename);
  await fs.writeFile(outPath, output, 'utf8');
  console.log(`✅ Saved article → public/content/${filename}`);
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
  const { topic: topicInput, genre } = parseArgs();
  await runGeneratePost({ topic: topicInput, genre });
}

export async function runGeneratePost(options: GenerateOptions = {}) {
  const genre = options.genre ?? DEFAULT_GENRE;
  const topic = options.topic ?? (await pickTopic(genre));
  const research = await researchTopic(topic, genre);
  const draft = await draftArticle(topic, genre, research);
  const review = await runCopyReviewAgent(topic, genre, draft.html);
  const reviewedHtml = review?.html?.trim() || draft.html;
  const compliance = enforceAffiliateCompliance(reviewedHtml);
  logAffiliateCompliance(compliance.affiliateLinks, compliance.disclosureInserted);
  if (compliance.affiliateLinks > 0) {
    draft.frontmatter.affiliateDisclosure = true;
  }
  const imageSuggestion = await suggestHeroImage(topic, genre, compliance.html);
  if (imageSuggestion?.imageUrl) {
    draft.frontmatter.imageUrl = imageSuggestion.imageUrl;
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
  await persistArticle(draft.frontmatter, compliance.html, meta);
  await runUpdateIndex();
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
