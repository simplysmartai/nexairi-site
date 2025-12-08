import 'dotenv/config';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { FALLBACK_POST_IMAGE } from '../constants/media.ts';

interface ExtractedFrontmatter {
  frontmatter: Record<string, unknown>;
  body: string;
}

interface BodySection {
  start: number;
  end: number;
  openTag: string;
  innerHtml: string;
  closeTag: string;
}

interface HeroSuggestion {
  alt: string;
  prompt?: string;
  credit?: string;
  keywords: string[];
}

interface InlinePlacement {
  paragraphIndex: number;
  keywords: string[];
  alt: string;
  caption?: string;
}

interface InlinePlacementResponse {
  placements?: InlinePlacement[];
}

const REQUIRED_FIELDS = ['title', 'slug', 'summary', 'category'] as const;
const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'content');
const TARGET_INLINE_COUNT = 2;
const INLINE_FIGURE_CLASS = 'nx-inline-image';
const FALLBACK_PLACEHOLDER = 'modern editorial photography';

const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const imageCache = new Map<string, string>();

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, '');
}

function extractFrontmatter(source: string): ExtractedFrontmatter {
  const text = stripBom(source);
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*/);
  if (match) {
    try {
      const data = parseYaml(match[1]) as Record<string, unknown> | undefined;
      const body = text.slice(match[0].length);
      return { frontmatter: data ?? {}, body };
    } catch (error) {
      console.warn('⚠️  Failed to parse frontmatter. Leaving content untouched.', error);
    }
  }
  return { frontmatter: {}, body: text };
}

function serializeFrontmatter(data: Record<string, unknown>): string {
  const ordered: Record<string, unknown> = {};
  const push = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    ordered[key] = value;
  };

  push('title', data.title);
  push('slug', data.slug);
  push('date', data.date);
  push('category', data.category);
  push('author', data.author);
  push('summary', data.summary);
  push('excerpt', data.excerpt);
  push('tags', data.tags);
  push('imageUrl', data.imageUrl);
  push('isFeatured', data.isFeatured);
  push('series', data.series);
  push('seriesLabel', data.seriesLabel);
  push('metaDescription', data.metaDescription);
  push('heroAlt', data.heroAlt);
  push('heroCredit', data.heroCredit);
  push('imagePrompt', data.imagePrompt);
  push('affiliateDisclosure', data.affiliateDisclosure);

  const yaml = stringifyYaml(ordered, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n\n`;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function deriveKeywords(title: string, category: string): string[] {
  const base = `${title} ${category}`.toLowerCase();
  const words = base
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);
  if (words.length === 0) {
    return [category.toLowerCase() || FALLBACK_PLACEHOLDER];
  }
  return Array.from(new Set(words)).slice(0, 4);
}

function extractBodySection(html: string): BodySection | null {
  const regex = /(<section[^>]*class=['"][^'"]*nx-article__body[^'"]*['"][^>]*>)([\s\S]*?)(<\/section>)/i;
  const match = regex.exec(html);
  if (!match) return null;
  return {
    start: match.index,
    end: match.index + match[0].length,
    openTag: match[1],
    innerHtml: match[2],
    closeTag: match[3],
  };
}

function hasInlineImages(html: string): boolean {
  return /<img\s/i.test(html);
}

function heroNeedsRefresh(value: unknown): boolean {
  if (typeof value !== 'string' || value.length === 0) {
    return true;
  }
  if (value === FALLBACK_POST_IMAGE) {
    return true;
  }
  if (/source\.unsplash\.com/i.test(value)) {
    return true;
  }
  return false;
}

function stripInlineFigures(html: string): { html: string; removed: boolean } {
  let removed = false;
  const cleaned = html.replace(/<figure[\s\S]*?<\/figure>/gi, (block) => {
    if (/class\s*=\s*["'][^"']*nx-inline-image[^"']*["']/i.test(block)) {
      removed = true;
      return '';
    }
    return block;
  });
  return { html: cleaned.replace(/\n{3,}/g, '\n\n'), removed };
}

function containsLegacyInlineImages(html: string): boolean {
  if (/class\s*=\s*["'][^"']*nx-inline-image[^"']*["']/i.test(html)) {
    return true;
  }
  if (/images\.unsplash\.com/i.test(html) || /source\.unsplash\.com/i.test(html)) {
    return true;
  }
  return false;
}

function buildFigureHtml(params: { slug: string; seq: number; imageUrl: string; alt: string; caption?: string }): string {
  const { slug, seq, imageUrl, alt, caption } = params;
  const safeAlt = alt.replace(/"/g, '&quot;');
  const captionHtml = caption ? `\n  <figcaption>${caption}</figcaption>` : '';
  return `<figure class="${INLINE_FIGURE_CLASS}" data-inline-image="${slug}-${seq}">\n  <img src="${imageUrl}" alt="${safeAlt}" loading="lazy" decoding="async">${captionHtml}\n</figure>`;
}

function insertFigureAfterParagraph(bodyHtml: string, targetIndex: number, figureHtml: string): { html: string; inserted: boolean } {
  const regex = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = regex.exec(bodyHtml)) !== null) {
    const block = match[0];
    if (/data-component="affiliate-disclosure"/i.test(block)) {
      continue;
    }
    count += 1;
    if (count === targetIndex) {
      const insertPos = regex.lastIndex;
      const before = bodyHtml.slice(0, insertPos);
      const after = bodyHtml.slice(insertPos);
      return { html: `${before}\n${figureHtml}\n${after}`, inserted: true };
    }
  }
  return { html: bodyHtml, inserted: false };
}

function hashKeywords(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function resolveImageUrl(keywords: string[], size: { width: number; height: number }): Promise<string> {
  const query = keywords.length ? keywords.join(' ') : FALLBACK_PLACEHOLDER;
  const normalized = query
    .split(',')
    .map((part) => part.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .slice(0, 3)
    .join(',') || 'editorial';
  const cacheKey = `${size.width}x${size.height}:${normalized}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  const lock = hashKeywords(query) % 1000;
  const imageUrl = `https://loremflickr.com/${size.width}/${size.height}/${encodeURIComponent(normalized)}/all?lock=${lock}`;
  imageCache.set(cacheKey, imageUrl);
  return imageUrl;
}

async function requestHeroSuggestion(params: {
  title: string;
  category: string;
  summary: string;
  bodyPreview: string;
}): Promise<HeroSuggestion> {
  if (!openai) {
    return {
      alt: `${params.title} visual narrative`,
      prompt: params.summary.slice(0, 120) || params.title,
      credit: 'Unsplash',
      keywords: deriveKeywords(params.title, params.category),
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            "You are Nexairi's visual editor. Recommend a single hero image concept with style keywords, alt text, and optional credit. Always respond with a valid JSON object.",
        },
        {
          role: 'user',
          content: JSON.stringify({
            title: params.title,
            category: params.category,
            summary: params.summary,
            bodyPreview: params.bodyPreview,
          }),
        },
      ],
    });

    const payload = completion.choices[0].message?.content;
    if (payload) {
      const parsed = JSON.parse(payload) as Partial<HeroSuggestion> & { keywords?: string[] };
      return {
        alt: parsed.alt?.trim() || `${params.title} hero image`,
        prompt: parsed.prompt?.trim() || parsed.keywords?.join(', '),
        credit: parsed.credit?.trim() || 'Nexairi Visual Systems',
        keywords: parsed.keywords?.filter(Boolean) ?? deriveKeywords(params.title, params.category),
      };
    }
  } catch (error) {
    console.warn('⚠️  Hero image agent failed, using fallback keywords.', error);
  }

  return {
    alt: `${params.title} hero image`,
    prompt: params.summary.slice(0, 120),
    credit: 'Nexairi Visual Systems',
    keywords: deriveKeywords(params.title, params.category),
  };
}

async function requestInlinePlacements(params: {
  title: string;
  category: string;
  summary: string;
  paragraphPreviews: { index: number; preview: string }[];
  paragraphCount: number;
}): Promise<InlinePlacement[]> {
  if (!openai) {
    return buildFallbackInlinePlacements(params.title, params.category, params.paragraphCount);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.45,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            "You are Nexairi's image-sourcing agent. Pick up to two paragraph slots that would benefit from inline imagery. Provide keywords, alt text, and an optional caption, and respond with a valid JSON object.",
        },
        {
          role: 'user',
          content: JSON.stringify({
            title: params.title,
            category: params.category,
            summary: params.summary,
            paragraphCount: params.paragraphCount,
            paragraphPreviews: params.paragraphPreviews,
            maxPlacements: TARGET_INLINE_COUNT,
          }),
        },
      ],
    });
    const payload = completion.choices[0].message?.content;
    if (!payload) {
      return buildFallbackInlinePlacements(params.title, params.category, params.paragraphCount);
    }
    const parsed = JSON.parse(payload) as InlinePlacementResponse;
    if (!parsed.placements || parsed.placements.length === 0) {
      return buildFallbackInlinePlacements(params.title, params.category, params.paragraphCount);
    }
    return parsed.placements
      .filter((placement) => typeof placement.paragraphIndex === 'number')
      .map((placement) => ({
        paragraphIndex: Math.max(1, Math.floor(placement.paragraphIndex)),
        keywords: placement.keywords?.filter(Boolean) ?? deriveKeywords(params.title, params.category),
        alt: placement.alt?.trim() || `${params.title} detail`,
        caption: placement.caption?.trim(),
      }))
      .slice(0, TARGET_INLINE_COUNT);
  } catch (error) {
    console.warn('⚠️  Inline image agent failed, using fallback placement.', error);
    return buildFallbackInlinePlacements(params.title, params.category, params.paragraphCount);
  }
}

function buildFallbackInlinePlacements(title: string, category: string, paragraphCount: number): InlinePlacement[] {
  if (paragraphCount === 0) return [];
  const keywords = deriveKeywords(title, category);
  const placements: InlinePlacement[] = [
    {
      paragraphIndex: Math.min(2, paragraphCount),
      keywords,
      alt: `${title} detail visual`,
      caption: undefined,
    },
  ];
  if (paragraphCount > 4) {
    placements.push({
      paragraphIndex: Math.min(5, paragraphCount),
      keywords,
      alt: `${title} supporting detail`,
      caption: undefined,
    });
  }
  return placements.slice(0, TARGET_INLINE_COUNT);
}

function extractParagraphPreviews(innerHtml: string, maxSamples = 8): { previews: { index: number; preview: string }[]; count: number } {
  const regex = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
  const previews: { index: number; preview: string }[] = [];
  let match: RegExpExecArray | null;
  let count = 0;
  while ((match = regex.exec(innerHtml)) !== null) {
    const block = match[0];
    if (/data-component="affiliate-disclosure"/i.test(block)) {
      continue;
    }
    count += 1;
    if (previews.length < maxSamples) {
      previews.push({ index: count, preview: stripHtml(block).slice(0, 200) });
    }
  }
  return { previews, count };
}

async function injectInlineImages(innerHtml: string, slug: string, placements: InlinePlacement[]): Promise<{ html: string; added: number }> {
  if (placements.length === 0) {
    return { html: innerHtml, added: 0 };
  }
  let working = innerHtml;
  let added = 0;
  const sorted = [...placements].sort((a, b) => a.paragraphIndex - b.paragraphIndex);
  for (let i = 0; i < sorted.length; i += 1) {
    const placement = sorted[i];
    const keywords = placement.keywords?.length ? placement.keywords : deriveKeywords(slug, '');
    const imageUrl = await resolveImageUrl(keywords, { width: 1400, height: 900 });
    const figureHtml = buildFigureHtml({
      slug,
      seq: i + 1,
      imageUrl,
      alt: placement.alt || `${slug} inline visual`,
      caption: placement.caption,
    });
    const insertion = insertFigureAfterParagraph(working, placement.paragraphIndex, figureHtml);
    if (insertion.inserted) {
      working = insertion.html;
      added += 1;
    }
  }
  return { html: working, added };
}

function ensureRequiredFrontmatter(frontmatter: Record<string, unknown>, filename: string): boolean {
  return REQUIRED_FIELDS.every((field) => typeof frontmatter[field] === 'string' && (frontmatter[field] as string).length > 0);
}

async function processFile(filename: string): Promise<{ filename: string; heroUpdated: boolean; inlineAdded: number } | null> {
  const absolutePath = path.resolve(CONTENT_DIR, filename);
  const original = await fs.readFile(absolutePath, 'utf8');
  const { frontmatter, body } = extractFrontmatter(original);
  if (!ensureRequiredFrontmatter(frontmatter, filename)) {
    console.warn(`⚠️  Skipping ${filename}: frontmatter missing required fields.`);
    return null;
  }

  const slug = (frontmatter.slug as string) ?? filename.replace(/\.html$/, '');
  const title = frontmatter.title as string;
  const summary = (frontmatter.summary as string) ?? '';
  const category = (frontmatter.category as string) ?? 'Lifestyle';

  const inlineStripped = stripInlineFigures(body);
  let workingHtml = inlineStripped.html;

  const heroNeedsUpdate = heroNeedsRefresh(frontmatter.imageUrl);
  const inlineNeeded = inlineStripped.removed || containsLegacyInlineImages(body) || !hasInlineImages(workingHtml);

  if (!heroNeedsUpdate && !inlineNeeded) {
    return null;
  }
  let heroUpdated = false;
  let inlineAdded = 0;

  if (heroNeedsUpdate) {
    const heroSuggestion = await requestHeroSuggestion({
      title,
      category,
      summary,
      bodyPreview: stripHtml(workingHtml).slice(0, 600),
    });
    const heroUrl = await resolveImageUrl(heroSuggestion.keywords, { width: 1600, height: 900 });
    frontmatter.imageUrl = heroUrl;
    frontmatter.heroAlt = heroSuggestion.alt;
    if (heroSuggestion.credit) {
      frontmatter.heroCredit = heroSuggestion.credit;
    }
    if (heroSuggestion.prompt) {
      frontmatter.imagePrompt = heroSuggestion.prompt;
    }
    heroUpdated = true;
  }

  if (inlineNeeded) {
    const bodySection = extractBodySection(workingHtml);
    const targetHtml = bodySection ? bodySection.innerHtml : workingHtml;
    const { previews, count } = extractParagraphPreviews(targetHtml);
    const placements = await requestInlinePlacements({
      title,
      category,
      summary,
      paragraphPreviews: previews,
      paragraphCount: count,
    });
    const { html: updatedInner, added } = await injectInlineImages(targetHtml, slug, placements);
    inlineAdded = added;
    if (added > 0) {
      if (bodySection) {
        const rebuiltSection = `${bodySection.openTag}${updatedInner}${bodySection.closeTag}`;
        workingHtml = `${workingHtml.slice(0, bodySection.start)}${rebuiltSection}${workingHtml.slice(bodySection.end)}`;
      } else {
        workingHtml = updatedInner;
      }
    }
  }

  if (!heroUpdated && inlineAdded === 0) {
    return null;
  }

  const nextContent = `${serializeFrontmatter(frontmatter)}${workingHtml.trim()}\n`;
  await fs.writeFile(absolutePath, nextContent, 'utf8');
  return { filename, heroUpdated, inlineAdded };
}

async function run() {
  const entries = await fs.readdir(CONTENT_DIR);
  const htmlFiles = entries.filter((name) => name.endsWith('.html'));
  const results: { filename: string; heroUpdated: boolean; inlineAdded: number }[] = [];
  for (const filename of htmlFiles) {
    const outcome = await processFile(filename);
    if (outcome) {
      results.push(outcome);
      console.log(
        `🖼️  ${filename}: hero ${outcome.heroUpdated ? 'updated' : 'unchanged'}, inline images added: ${outcome.inlineAdded}`,
      );
    }
  }

  if (results.length === 0) {
    console.log('✅ All articles already have enriched imagery.');
    return;
  }

  try {
    await import('./updatePostsIndex');
    console.log('🗂️  posts.json refreshed to capture new hero thumbnails.');
  } catch (error) {
    console.warn('⚠️  Unable to refresh posts index automatically.', error);
  }

  console.log(`✨ Updated imagery for ${results.length} article(s).`);
}

run().catch((error) => {
  console.error('backfillImages failed:', error);
  process.exit(1);
});
