import 'dotenv/config';

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
    const response = await geminiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    const text = (response as any).text?.() ?? (response as any).text;
    if (text) {
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
      return { hero, diagrams };
    }
  } catch (error) {
    console.warn('⚠️  Gemini image brief failed, using fallback prompts.', error);
  }
  return {
    hero: {
      alt: `${title} hero artwork`,
      prompt: `${title} hero, editorial rendering`,
      url: placeholderFromPrompt(title),
    },
    diagrams: [],
  };
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
