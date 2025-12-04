import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { FALLBACK_POST_IMAGE } from '../constants/media.ts';
import { normalizeCategoryLabel } from '../utils/category.ts';

interface Frontmatter {
  id?: string;
  title?: string;
  slug?: string;
  date?: string;
  author?: string;
  summary?: string;
  tags?: string[] | string;
  contentFile?: string;
  category?: string;
  excerpt?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  series?: string;
  seriesLabel?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  date: string; // ISO 8601
  author: string;
  summary: string;
  excerpt: string;
  category: string;
  tags: string[];
  contentFile: string;
  imageUrl: string;
  isFeatured?: boolean;
  series?: string;
  seriesLabel?: string;
}

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.resolve(ROOT_DIR, 'public', 'content');
const OUTPUT_FILE = path.resolve(ROOT_DIR, 'public', 'posts.json');
const DEFAULT_AUTHOR = 'Nexairi Editorial';

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'untitled';
}

function normalizeTags(tags: Frontmatter['tags']): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.trim()).filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function toIsoDate(value: string | undefined, fallbackDate: Date): string {
  const date = value ? new Date(value) : fallbackDate;
  if (Number.isNaN(date.getTime())) {
    return fallbackDate.toISOString();
  }
  return date.toISOString();
}

function findMatchingBrace(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function parseFrontmatter(source: string): { data: Frontmatter; body: string } {
  const withoutBom = source.replace(/^\uFEFF/, '');
  const yamlMatch = withoutBom.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*/);
  if (yamlMatch) {
    try {
      const data = parseYaml(yamlMatch[1]) as Frontmatter | undefined;
      const body = withoutBom.slice(yamlMatch[0].length);
      return { data: data ?? {}, body };
    } catch (error) {
      console.warn('Failed to parse YAML frontmatter:', error);
    }
  }

  const trimmedStart = withoutBom.trimStart();
  const offset = withoutBom.length - trimmedStart.length;
  if (trimmedStart.startsWith('{')) {
    const endIndex = findMatchingBrace(trimmedStart);
    if (endIndex !== -1) {
      const jsonBlock = trimmedStart.slice(0, endIndex + 1);
      try {
        const data = JSON.parse(jsonBlock) as Frontmatter;
        const body = trimmedStart.slice(endIndex + 1);
        return { data, body };
      } catch (error) {
        console.warn('Failed to parse JSON frontmatter:', error);
      }
    }
  }

  return { data: {}, body: withoutBom };
}

async function collectContentFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectContentFiles(fullPath)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.md', '.mdx', '.markdown', '.html', '.htm'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function deriveTitleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function deriveSummary(body: string): string {
  const clean = stripHtml(body).slice(0, 320).trim();
  return clean || 'Further analysis coming soon.';
}

function deriveExcerpt(fm: Frontmatter, body: string): string {
  if (fm.excerpt) return fm.excerpt.trim();
  if (fm.summary) return fm.summary.trim();
  return stripHtml(body).slice(0, 200).trim() || 'High-signal intelligence dispatch coming online.';
}

function deriveCategory(fm: Frontmatter, tags: string[], slug: string): string {
  return normalizeCategoryLabel(fm.category, slug, tags);
}

function extractFirstImage(body: string): string | undefined {
  const match = body.match(/<img[^>]+src="([^"]+)"/i);
  if (match && match[1]) {
    return match[1];
  }
  return undefined;
}

async function buildPostFromFile(filePath: string): Promise<Post> {
  const raw = await fs.readFile(filePath, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const fileName = path.basename(filePath, path.extname(filePath));
  const slug = data.slug || slugify(fileName);
  const stats = await fs.stat(filePath);
  const isoDate = toIsoDate(data.date, stats.mtime);
  const tags = normalizeTags(data.tags);
  const category = deriveCategory(data, tags, slug);
  const summary = data.summary || deriveSummary(body);
  const excerpt = deriveExcerpt(data, body);
  const imageUrl = data.imageUrl || extractFirstImage(body) || FALLBACK_POST_IMAGE;

  return {
    id: data.id || slug,
    title: data.title || deriveTitleFromSlug(slug),
    slug,
    date: isoDate,
    author: data.author || DEFAULT_AUTHOR,
    summary,
    excerpt,
    category,
    tags,
    contentFile: path.relative(path.resolve(ROOT_DIR, 'public'), filePath).replace(/\\/g, '/'),
    imageUrl,
    isFeatured: data.isFeatured,
    series: data.series,
    seriesLabel: data.seriesLabel,
  };
}

async function writePostsIndex(): Promise<void> {
  const files = await collectContentFiles(CONTENT_DIR);
  if (files.length === 0) {
    console.warn('No content files found under public/content.');
  }

  const posts: Post[] = [];
  for (const file of files) {
    try {
      const post = await buildPostFromFile(file);
      posts.push(post);
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
  console.log(`Saved ${posts.length} posts to ${path.relative(ROOT_DIR, OUTPUT_FILE)}.`);
}

writePostsIndex().catch((error) => {
  console.error('updatePostsIndex failed:', error);
  process.exitCode = 1;
});
