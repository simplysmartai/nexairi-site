import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

interface PostRecord {
  id: string;
  title: string;
  slug: string;
  date: string;
  author: string;
  summary: string;
  category: string;
  tags: string[];
  imageUrl: string;
  isFeatured?: boolean;
  series?: string;
  seriesLabel?: string;
  contentFile: string;
}

interface ExtractedFrontmatter {
  frontmatter: Record<string, unknown>;
  body: string;
}

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const POSTS_PATH = path.resolve(PUBLIC_DIR, 'posts.json');

const AUTHOR_POOLS: Record<string, string[]> = {
  Technology: ['Sami W.', 'Tepper B.', 'Jackson S.'],
  Lifestyle: ['Kelly M.', 'Sarah R.', 'Lily B.'],
  Travel: ['Lily B.', 'Barry L.', 'Kelly M.'],
  Sports: ['Jackson S.', 'Barry L.', 'Tepper B.'],
};
const FALLBACK_AUTHORS = ['Kelly M.', 'Sami W.', 'Tepper B.', 'Sarah R.', 'Jackson S.', 'Lily B.', 'Barry L.'];
const ALL_AUTHORS = Array.from(
  new Set([...Object.values(AUTHOR_POOLS).flat(), ...FALLBACK_AUTHORS]),
);

function hashSlug(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function assignAuthor(category: string, slug: string, current?: string): string {
  if (current && ALL_AUTHORS.includes(current)) {
    return current;
  }
  if (current && !current.toLowerCase().includes('nexairi')) {
    return current;
  }
  const pool = AUTHOR_POOLS[category] ?? FALLBACK_AUTHORS;
  const index = hashSlug(slug) % pool.length;
  return pool[index];
}

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
      console.warn('Failed to parse frontmatter block, preserving original content. Error:', error);
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

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

async function ensureFrontmatter(): Promise<void> {
  const raw = await fs.readFile(POSTS_PATH, 'utf8');
  const posts = JSON.parse(raw) as PostRecord[];
  console.log(`Inspecting ${posts.length} posts for frontmatter.`);
  let updatedCount = 0;

  for (const post of posts) {
    const absolutePath = path.resolve(PUBLIC_DIR, post.contentFile);
    const original = await fs.readFile(absolutePath, 'utf8');
    const { frontmatter, body } = extractFrontmatter(original);

    const category = (frontmatter.category as string | undefined) ?? post.category;
    const rawAuthor = (frontmatter.author as string | undefined) ?? post.author;
    const merged: Record<string, unknown> = {
      title: frontmatter.title ?? post.title,
      slug: frontmatter.slug ?? post.slug,
      date: frontmatter.date ?? post.date,
      category,
      author: assignAuthor(category, post.slug, rawAuthor),
      summary: frontmatter.summary ?? post.summary,
      excerpt: frontmatter.excerpt ?? post.summary,
      tags: coerceStringArray(frontmatter.tags).length > 0 ? frontmatter.tags : post.tags,
      imageUrl: frontmatter.imageUrl ?? post.imageUrl,
      isFeatured: frontmatter.isFeatured ?? post.isFeatured ?? false,
      series: frontmatter.series ?? post.series,
      seriesLabel: frontmatter.seriesLabel ?? post.seriesLabel,
      metaDescription: frontmatter.metaDescription,
      heroAlt: frontmatter.heroAlt,
      heroCredit: frontmatter.heroCredit,
      imagePrompt: frontmatter.imagePrompt,
      affiliateDisclosure: frontmatter.affiliateDisclosure,
    };

    const normalizedBody = body.replace(/^\s*/, '');
    const nextContent = `${serializeFrontmatter(merged)}${normalizedBody}`;

    if (nextContent !== original) {
      updatedCount += 1;
      await fs.writeFile(absolutePath, `${nextContent.trimEnd()}\n`, 'utf8');
    }
  }

  console.log(`✅ Frontmatter synchronized for ${updatedCount} files.`);
}

ensureFrontmatter().catch((error) => {
  console.error('syncFrontmatter failed:', error);
  process.exit(1);
});
