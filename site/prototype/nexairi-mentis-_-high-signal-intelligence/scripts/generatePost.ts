import 'dotenv/config';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import OpenAI from 'openai';
import { perplexity } from '@ai-sdk/perplexity';
import { GoogleGenerativeAI } from '@google/genai';

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
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const GENRE_PROFILES = {
  lifestyle: {
    author: 'Nexairi Lifestyle',
    tone: 'calm, design-forward, practical empathy',
    tags: ['lifestyle', 'rituals', 'calm'],
  },
  technology: {
    author: 'Nexairi Technology',
    tone: 'analytical, systems-minded, quietly ambitious',
    tags: ['technology', 'ai', 'systems'],
  },
  travel: {
    author: 'Nexairi Travel',
    tone: 'sensory detail, logistics clarity, modern nomad',
    tags: ['travel', 'mobility', 'cities'],
  },
  sports: {
    author: 'Nexairi Sports Lab',
    tone: 'performance-first, human + algorithmic edge',
    tags: ['sports', 'performance', 'analysis'],
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
  };
  html: string;
}

interface MetaPayload {
  metaDescription: string;
  heroAlt: string;
  imagePrompt: string;
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

  console.log('🔎 Gathering research via Perplexity…');
  const { text } = await perplexityClient.generateText({
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

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.55,
    messages: [
      {
        role: 'system',
        content: `You are Nexairi's editorial AI. Tone: ${profile.tone}. Output JSON with keys frontmatter + html.
frontmatter must include title, slug, summary (<=160 chars), tags array (3-6, lowercase). HTML must be semantic (<article>, <section>, etc.).`,
      },
      {
        role: 'user',
        content: JSON.stringify({ topic, genre, research }),
      },
    ],
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

  return parsed;
}

async function buildMetaAssets(topic: string, html: string): Promise<MetaPayload | null> {
  if (!geminiClient) {
    console.log('⚠️  Skipping Gemini meta layer (GEMINI_API_KEY missing).');
    return null;
  }

  console.log('🎨 Requesting Gemini meta + imagery guidance…');
  const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Create metadata for Nexairi article.
Return JSON with keys: metaDescription (<=155 chars), heroAlt, imagePrompt (stable diffusion style).
Topic: ${topic}
Preview HTML: ${html.slice(0, 2000)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) return null;
  try {
    const meta = JSON.parse(text) as MetaPayload;
    return meta;
  } catch (error) {
    console.warn('Gemini meta payload parse failed:', error);
    return null;
  }
}

function serializeFrontmatter(frontmatter: Record<string, string | string[]>) {
  const lines: string[] = ['---'];
  Object.entries(frontmatter).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      lines.push(`${key}:`);
      value.forEach((item) => lines.push(`  - "${item}"`));
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
  const fm = {
    title: frontmatter.title,
    slug: frontmatter.slug!,
    date: new Date().toISOString(),
    author: genreProfile?.author || 'Nexairi Editorial',
    summary: frontmatter.summary || 'High-signal intelligence.',
    tags: frontmatter.tags,
    ...(meta?.metaDescription ? { metaDescription: meta.metaDescription } : {}),
    ...(meta?.heroAlt ? { heroAlt: meta.heroAlt } : {}),
    ...(meta?.imagePrompt ? { imagePrompt: meta.imagePrompt } : {}),
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
  const meta = await buildMetaAssets(topic, draft.html);
  await persistArticle(draft.frontmatter, draft.html, meta);
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
