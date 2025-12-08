import 'dotenv/config';
import dotenv from 'dotenv';

// Load .env.local if present (local overrides for development)
dotenv.config({ path: '.env.local', override: false });

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { readArticle, writeArticle, listArticleFilenames } from './lib/content';

interface ImageBrief {
  hero: {
    alt: string;
    prompt: string;
    url: string;
  };
  diagrams: Array<{
    id: string;
    prompt: string;
    caption: string;
  }>;
}

const REPORT_DIR = path.resolve(process.cwd(), 'reports', 'images');
const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

function parseArgs(): { slug?: string; runAll: boolean; dryRun: boolean } {
  const args = process.argv.slice(2);
  let slug: string | undefined;
  let runAll = false;
  let dryRun = false;
  for (const arg of args) {
    if (arg === '--all') {
      runAll = true;
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (!slug && !arg.startsWith('--')) {
      slug = arg;
    }
  }
  return { slug, runAll, dryRun };
}

function hashKeywords(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function placeholderFromPrompt(prompt: string, width = 1600, height = 900): string {
  const normalized = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'editorial-ai';
  const lock = hashKeywords(normalized) % 1000;
  return `https://loremflickr.com/${width}/${height}/${encodeURIComponent(normalized)}/all?lock=${lock}`;
}

async function requestBrief(slug: string, title: string, summary: string, body: string): Promise<ImageBrief> {
  if (!geminiClient) {
    const fallbackPrompt = `${title} hero, neon data grid, human silhouette, editorial lighting`;
    return {
      hero: {
        alt: `${title} hero artwork`,
        prompt: fallbackPrompt,
        url: placeholderFromPrompt(fallbackPrompt),
      },
      diagrams: [
        {
          id: `${slug}-diagram-1`,
          prompt: `${title} diagram showing workflow swimlanes`,
          caption: 'Workflow swimlanes for the orchestration stack.',
        },
        {
          id: `${slug}-diagram-2`,
          prompt: `${title} metric stack heatmap`,
          caption: 'Performance dashboard mock with AI signals.',
        },
      ],
    };
  }
  const prompt = `You are Nexairi's visual systems director. Return JSON with keys hero + diagrams.
hero: { alt, prompt, paletteWords[] }
diagrams: array of 2 objects { id, prompt, caption }
Focus on: ${title}
Summary: ${summary}
HTML Preview: ${body.slice(0, 2000)}`;
  try {
    // Try with configured Gemini model first, then fall back if quota or model errors occur.
    const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const fallbackModel = 'gemini-2.5-flash';

    async function tryModel(modelName: string) {
      try {
        console.log(`🎨 Requesting Gemini image brief (model: ${modelName})...`);
        const response = await geminiClient.models.generateContent({ model: modelName, contents: prompt });
        const text = (response as any).text?.() ?? (response as any).text;
        if (!text) return null;
        try {
          const parsed = JSON.parse(text) as ImageBrief;
          const hero = {
            alt: parsed.hero?.alt?.trim() || `${title} hero artwork`,
            prompt: parsed.hero?.prompt?.trim() || `${title} hero concept`,
            url: placeholderFromPrompt(parsed.hero?.prompt ?? title),
          };
          const diagrams = Array.isArray(parsed.diagrams)
            ? parsed.diagrams.slice(0, 2).map((diagram, index) => ({
                id: diagram.id?.trim() || `${slug}-diagram-${index + 1}`,
                prompt: diagram.prompt?.trim() || `${title} diagram ${index + 1}`,
                caption: diagram.caption?.trim() || 'Diagram caption TBD.',
              }))
            : [];
          return { hero, diagrams } as ImageBrief;
        } catch (parseErr) {
          console.warn('Gemini meta payload parse failed:', parseErr);
          return null;
        }
      } catch (err: any) {
        // Surface quota/model errors so caller can decide to retry with fallback
        const code = err?.status || err?.error?.code || err?.code;
        const msg = err?.message || JSON.stringify(err?.error) || String(err);
        console.warn(`Gemini model ${modelName} request failed (code: ${code}):`, msg);
        return null;
      }
    }

    // First attempt: preferred model
    const preferredResult = await tryModel(preferredModel);
    if (preferredResult) return preferredResult;

    // If preferred model failed and wasn't already the fallback, attempt fallback model
    if (preferredModel !== fallbackModel) {
      try {
        console.log(`⚠️ Preferred model ${preferredModel} failed — retrying with fallback model ${fallbackModel}...`);
        const fallbackResult = await tryModel(fallbackModel);
        if (fallbackResult) return fallbackResult;
      } catch (err) {
        console.warn('⚠️  Gemini fallback model request failed:', err);
      }
    }
  } catch (error) {
    // If we get here, Gemini failed for other reasons (network, SDK errors, etc.)
    console.warn('⚠️  Gemini image brief failed, using fallback prompts.', error);
  }
  // If Gemini fails or returns nothing, attempt to auto-generate a richer set of briefs
  // by parsing the article for recap-specific sections (top-10-games, hot-players, upcoming-top-5)
  function extractListItems(sectionId: string): string[] {
    try {
      const sectionRegex = new RegExp(`<section[^>]*id=\\"${sectionId}\\"[^>]*>[\\s\\S]*?<ol[^>]*>([\\s\\S]*?)<\\/ol>`, 'i');
      const match = body.match(sectionRegex);
      if (!match) return [];
      const olHtml = match[1];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const items: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = liRegex.exec(olHtml)) !== null) {
        const text = m[1].replace(/<[^>]*>/g, '').trim();
        if (text) items.push(text);
      }
      return items;
    } catch (err) {
      return [];
    }
  }

  const topGames = extractListItems('top-10-games');
  const hotPlayers = extractListItems('hot-players');
  const upcoming = extractListItems('upcoming-top-5');

  const heroPrompt = `${title} hero, editorial sports photography, dynamic composition, high contrast, shallow depth of field`;
  const hero = {
    alt: `${title} hero artwork`,
    prompt: heroPrompt,
    url: placeholderFromPrompt(heroPrompt),
  };

  const diagrams: ImageBrief['diagrams'] = [];
  // Create diagrams for top 5 players (or fewer based on content)
  (hotPlayers.slice(0, 5)).forEach((p, i) => {
    diagrams.push({
      id: `${slug}-player-${i + 1}`,
      prompt: `${p} portrait, editorial sports photography, close-up, dramatic lighting, team colors`,
      caption: `Hot streak: ${p}`,
    });
  });

  // Create diagrams for top 5 upcoming games
  (upcoming.slice(0, 5)).forEach((g, i) => {
    diagrams.push({
      id: `${slug}-upcoming-${i + 1}`,
      prompt: `${g} preview composite, two-team matchup, editorial action collage, dramatic lighting`,
      caption: `Look ahead: ${g}`,
    });
  });

  // If there are no parsed items, add two generic diagrams
  if (diagrams.length === 0) {
    diagrams.push(
      {
        id: `${slug}-diagram-1`,
        prompt: `${title} action shot, editorial sports composition`,
        caption: 'Top plays montage',
      },
      {
        id: `${slug}-diagram-2`,
        prompt: `${title} analytics dashboard mock, clean UI, focus on momentum`,
        caption: 'Key trends and metrics',
      },
    );
  }

  return { hero, diagrams };
}

async function persistBrief(slug: string, brief: ImageBrief): Promise<string> {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const file = path.join(REPORT_DIR, `${slug}.json`);
  await fs.writeFile(file, JSON.stringify({ generatedAt: new Date().toISOString(), ...brief }, null, 2), 'utf8');
  return file;
}

async function enrichArticle(slug: string, dryRun: boolean): Promise<void> {
  const article = await readArticle(slug);
  const title = String(article.frontmatter.title ?? article.slug);
  const summary = String(article.frontmatter.summary ?? article.frontmatter.excerpt ?? '');
  const brief = await requestBrief(article.slug, title, summary, article.body);
  if (!dryRun) {
    article.frontmatter.heroAlt = brief.hero.alt;
    article.frontmatter.imagePrompt = brief.hero.prompt;
    article.frontmatter.heroCredit = 'Gemini Visual Systems';
    article.frontmatter.imageUrl = brief.hero.url;
    await writeArticle(article);
  }
  const outPath = await persistBrief(article.slug, brief);
  console.log(`🖼️  Image brief ready for ${article.slug} → ${path.relative(process.cwd(), outPath)}`);
}

async function main() {
  const { slug, runAll, dryRun } = parseArgs();
  const targets: string[] = [];
  if (runAll) {
    targets.push(...(await listArticleFilenames()));
  } else if (slug) {
    targets.push(slug);
  } else {
    console.log('Provide a slug or use --all. Example: npm run image-agent -- top-15-games-holiday-2025');
    return;
  }
  for (const target of targets) {
    await enrichArticle(target, dryRun);
  }
  console.log('Next command: npm run seo-optimize');
}

main().catch((error) => {
  console.error('imageGenerator agent failed:', error);
  process.exit(1);
});
