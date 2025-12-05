import 'dotenv/config';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import type { BlogPost } from '../types';
import { readArticle, writeArticle, listArticleFilenames } from './lib/content';

interface SeoPlan {
  metaDescription: string;
  keywords: string[];
  headings: {
    h1?: string;
    h2: string[];
    h3: string[];
  };
  linkHints: string[];
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const DEFAULT_META = 'High-signal intelligence from Nexairi.';

function parseArgs(): { slug?: string; runAll: boolean } {
  const args = process.argv.slice(2);
  let slug: string | undefined;
  let runAll = false;
  for (const arg of args) {
    if (arg === '--all') {
      runAll = true;
      continue;
    }
    if (!slug && !arg.startsWith('--')) {
      slug = arg;
    }
  }
  return { slug, runAll };
}

async function loadPostsIndex(): Promise<BlogPost[]> {
  const file = path.resolve('public', 'posts.json');
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw) as BlogPost[];
}

function pickDefaultSlug(posts: BlogPost[]): string | undefined {
  if (posts.length === 0) return undefined;
  const sorted = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return sorted[0].slug;
}

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function deriveKeywords(title: string, summary?: string): string[] {
  const base = `${title} ${summary ?? ''}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 4);
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const token of base) {
    if (!seen.has(token)) {
      seen.add(token);
      keywords.push(token);
    }
    if (keywords.length === 6) break;
  }
  return keywords;
}

async function requestSeoPlan(title: string, summary: string, body: string): Promise<SeoPlan | null> {
  if (!openai) return null;
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are Nexairi SEO Ops. Return JSON with {metaDescription, keywords (array), headings:{h1,h2[],h3[]}, linkHints (array of internal link anchor ideas)}.',
      },
      {
        role: 'user',
        content: JSON.stringify({ title, summary, html: body.slice(0, 6000) }),
      },
    ],
  });
  const payload = completion.choices[0].message?.content;
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as Partial<SeoPlan>;
    return {
      metaDescription: parsed.metaDescription?.trim() || DEFAULT_META,
      keywords: parsed.keywords?.filter(Boolean) ?? [],
      headings: {
        h1: parsed.headings?.h1?.trim(),
        h2: parsed.headings?.h2?.filter(Boolean) ?? [],
        h3: parsed.headings?.h3?.filter(Boolean) ?? [],
      },
      linkHints: parsed.linkHints?.filter(Boolean) ?? [],
    };
  } catch (error) {
    console.warn('⚠️  SEO agent payload parse failed.', error);
    return null;
  }
}

function ensureHeading(html: string, tag: 'h2' | 'h3', text: string): string {
  if (new RegExp(`<${tag}\\b`, 'i').test(html)) {
    return html;
  }
  const heading = `\n<${tag}>${text}</${tag}>\n`;
  if (tag === 'h2') {
    const hrIndex = html.indexOf('<hr');
    if (hrIndex !== -1) {
      const insertAt = html.indexOf('>', hrIndex) + 1;
      return `${html.slice(0, insertAt)}\n${heading}${html.slice(insertAt)}`;
    }
    const firstParagraph = html.indexOf('</p>');
    if (firstParagraph !== -1) {
      const insertAt = firstParagraph + 4;
      return `${html.slice(0, insertAt)}${heading}${html.slice(insertAt)}`;
    }
    return `${heading}${html}`;
  }
  const h2Index = html.search(/<h2\b/i);
  if (h2Index !== -1) {
    const h2Close = html.indexOf('</h2>', h2Index);
    if (h2Close !== -1) {
      const insertAt = h2Close + 5;
      return `${html.slice(0, insertAt)}${heading}${html.slice(insertAt)}`;
    }
  }
  return `${html}${heading}`;
}

function insertRelatedLinks(html: string, links: BlogPost[]): string {
  if (!links.length) return html;
  const listItems = links
    .map((link) => {
      return `    <li><a href="/${link.slug}" data-related>${link.title}</a><span> — ${sanitizeText(link.summary ?? link.excerpt)}</span></li>`;
    })
    .join('\n');
  const block = `\n<section class="nx-related-links" aria-label="Related Intelligence">\n  <h3>Related Intelligence</h3>\n  <ul>\n${listItems}\n  </ul>\n</section>\n`;
  if (html.includes('nx-related-links')) {
    return html.replace(/<section[^>]*nx-related-links[\s\S]*?<\/section>/i, block.trim());
  }
  const closingIndex = html.lastIndexOf('</article>');
  if (closingIndex !== -1) {
    return `${html.slice(0, closingIndex)}${block}${html.slice(closingIndex)}`;
  }
  return `${html}${block}`;
}

function matchInternalLinks(posts: BlogPost[], keywords: string[], currentSlug: string): BlogPost[] {
  const pool = posts.filter((post) => post.slug !== currentSlug);
  const chosen: BlogPost[] = [];
  const seen = new Set<string>();
  for (const keyword of keywords) {
    const candidate = pool.find((post) => {
      const haystack = `${post.title} ${post.summary ?? ''}`.toLowerCase();
      return haystack.includes(keyword.toLowerCase());
    });
    if (candidate && !seen.has(candidate.slug)) {
      seen.add(candidate.slug);
      chosen.push(candidate);
    }
    if (chosen.length === 3) break;
  }
  return chosen;
}

async function optimizeArticle(slug: string, posts: BlogPost[]): Promise<void> {
  const article = await readArticle(slug);
  const title = String(article.frontmatter.title ?? article.slug);
  const summary = String(article.frontmatter.summary ?? article.frontmatter.excerpt ?? '');
  const plan =
    (await requestSeoPlan(title, summary, article.body)) ?? {
      metaDescription: summary.slice(0, 150) || DEFAULT_META,
      keywords: deriveKeywords(title, summary),
      headings: { h1: title, h2: ['Key Moves'], h3: ['Execution Notes'] },
      linkHints: deriveKeywords(title, summary).slice(0, 3),
    };

  if (plan.metaDescription) {
    article.frontmatter.metaDescription = plan.metaDescription.slice(0, 160);
  }
  if (plan.keywords.length) {
    article.frontmatter.seoKeywords = plan.keywords.slice(0, 6);
  }
  let body = article.body;
  if (plan.headings.h2.length) {
    body = ensureHeading(body, 'h2', plan.headings.h2[0]);
  }
  if (plan.headings.h3.length) {
    body = ensureHeading(body, 'h3', plan.headings.h3[0]);
  }
  const relatedKeywords = plan.linkHints.length ? plan.linkHints : plan.keywords;
  const internalLinks = matchInternalLinks(posts, relatedKeywords, article.slug);
  if (internalLinks.length) {
    body = insertRelatedLinks(body, internalLinks);
    article.frontmatter.internalLinks = internalLinks.map((link) => link.slug);
  }
  article.body = body;
  await writeArticle(article);
  console.log(`✨ SEO pass → ${article.filename} (${plan.keywords.length} keywords)`);
}

async function main() {
  const { slug, runAll } = parseArgs();
  const posts = await loadPostsIndex();
  let targets: string[] = [];
  if (runAll) {
    targets = await listArticleFilenames();
  } else if (slug) {
    targets = [slug];
  } else {
    const defaultSlug = pickDefaultSlug(posts);
    if (defaultSlug) {
      targets = [defaultSlug];
    }
  }
  if (targets.length === 0) {
    console.log('No targets provided. Use `npm run seo-optimize -- <slug>` or `--all`.');
    return;
  }
  for (const target of targets) {
    await optimizeArticle(target, posts);
  }
  console.log('Next command: npm run review-queue');
}

main().catch((error) => {
  console.error('seoOptimizer agent failed:', error);
  process.exit(1);
});
