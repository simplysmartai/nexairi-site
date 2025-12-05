import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AFFILIATE_TAG, findAmazonLinks, hasAffiliateDisclosure } from '../utils/affiliate.ts';

type ValidationIssue = {
  type: 'error' | 'warning';
  message: string;
};

interface PostRecord {
  id: string;
  title: string;
  slug: string;
  date: string;
  author: string;
  summary: string;
  excerpt: string;
  category: string;
  imageUrl: string;
  tags: unknown;
  contentFile: string;
  archived?: boolean;
  isFeatured?: unknown;
  series?: unknown;
  seriesLabel?: unknown;
}

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const POSTS_PATH = path.resolve(PUBLIC_DIR, 'posts.json');
const CONTENT_DIR = path.resolve(PUBLIC_DIR, 'content');

async function loadPosts(): Promise<PostRecord[]> {
  const raw = await fs.readFile(POSTS_PATH, 'utf8');
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error('posts.json must contain an array.');
  }
  return data as PostRecord[];
}

function isIsoDate(value: string): boolean {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return value.includes('T');
}

function trackIssue(list: ValidationIssue[], type: ValidationIssue['type'], message: string): void {
  list.push({ type, message });
}

async function readContentFile(relativePath: string): Promise<string | null> {
  const fullPath = path.resolve(PUBLIC_DIR, relativePath);
  try {
    const data = await fs.readFile(fullPath, 'utf8');
    return data;
  } catch {
    return null;
  }
}

function validateAffiliateDisclosures(html: string, prefix: string, issues: ValidationIssue[]): void {
  const matches = findAmazonLinks(html);
  if (matches.length === 0) {
    return;
  }

  if (!hasAffiliateDisclosure(html)) {
    trackIssue(issues, 'error', `${prefix}: affiliate links detected without disclosure block.`);
  }

  for (const match of matches) {
    const rawUrl = match;
    try {
      const url = new URL(rawUrl);
      if (url.searchParams.get('tag') !== AFFILIATE_TAG) {
        trackIssue(issues, 'error', `${prefix}: Amazon link missing ?tag=${AFFILIATE_TAG}.`);
      }
    } catch (error) {
      trackIssue(issues, 'warning', `${prefix}: Amazon link could not be parsed (${rawUrl}).`);
    }
  }
}

async function validatePosts(): Promise<void> {
  const issues: ValidationIssue[] = [];
  const posts = await loadPosts();

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  if (posts.length === 0) {
    trackIssue(issues, 'warning', 'posts.json is empty.');
  }

  for (const [index, post] of posts.entries()) {
    const prefix = `post[${index}] (${post.slug ?? post.id ?? 'unknown'})`;

    // Skip archived posts from regular validation (they remain in posts.json but are not part of public feeds)
    if (post.archived === true) {
      continue;
    }

    if (!post.id || typeof post.id !== 'string') {
      trackIssue(issues, 'error', `${prefix}: missing id.`);
    } else if (seenIds.has(post.id)) {
      trackIssue(issues, 'error', `${prefix}: duplicate id '${post.id}'.`);
    } else {
      seenIds.add(post.id);
    }

    if (!post.slug || typeof post.slug !== 'string') {
      trackIssue(issues, 'error', `${prefix}: missing slug.`);
    } else if (seenSlugs.has(post.slug)) {
      trackIssue(issues, 'error', `${prefix}: duplicate slug '${post.slug}'.`);
    } else {
      seenSlugs.add(post.slug);
    }

    if (!post.title || typeof post.title !== 'string') {
      trackIssue(issues, 'error', `${prefix}: missing title.`);
    }

    if (!post.summary || typeof post.summary !== 'string') {
      trackIssue(issues, 'warning', `${prefix}: summary missing.`);
    }

    if (!post.excerpt || typeof post.excerpt !== 'string') {
      trackIssue(issues, 'error', `${prefix}: missing excerpt.`);
    }

    if (!post.category || typeof post.category !== 'string') {
      trackIssue(issues, 'error', `${prefix}: missing category.`);
    }

    if (!post.imageUrl || typeof post.imageUrl !== 'string') {
      trackIssue(issues, 'warning', `${prefix}: imageUrl missing.`);
    }

    if (!post.author || typeof post.author !== 'string') {
      trackIssue(issues, 'warning', `${prefix}: author missing.`);
    }

    if (!post.date || typeof post.date !== 'string') {
      trackIssue(issues, 'error', `${prefix}: missing date.`);
    } else if (!isIsoDate(post.date)) {
      trackIssue(issues, 'error', `${prefix}: invalid ISO date '${post.date}'.`);
    }

    if (!Array.isArray(post.tags)) {
      trackIssue(issues, 'error', `${prefix}: tags must be an array of strings.`);
    } else {
      const invalidTag = post.tags.find((tag) => typeof tag !== 'string');
      if (invalidTag) {
        trackIssue(issues, 'error', `${prefix}: tags contain non-string values.`);
      }
    }

    if (!post.contentFile || typeof post.contentFile !== 'string') {
      trackIssue(issues, 'error', `${prefix}: missing contentFile.`);
    } else {
      // eslint-disable-next-line no-await-in-loop
      const content = await readContentFile(post.contentFile);
      if (!content) {
        trackIssue(issues, 'error', `${prefix}: content file not found (${post.contentFile}).`);
      } else {
        validateAffiliateDisclosures(content, prefix, issues);
      }
    }
  }

  if (!issues.some((issue) => issue.type === 'error')) {
    console.log(`✅ Validation passed for ${posts.length} posts.`);
  } else {
    console.error('❌ Validation failed:');
    for (const issue of issues) {
      if (issue.type === 'error') {
        console.error(`  - ERROR: ${issue.message}`);
      }
    }
  }

  for (const issue of issues) {
    if (issue.type === 'warning') {
      console.warn(`⚠️  ${issue.message}`);
    }
  }

  if (issues.some((issue) => issue.type === 'error')) {
    process.exitCode = 1;
  }
}

async function ensureContentDir(): Promise<void> {
  try {
    const stats = await fs.stat(CONTENT_DIR);
    if (!stats.isDirectory()) {
      throw new Error('content path is not a directory');
    }
  } catch (error) {
    throw new Error(`public/content missing or inaccessible: ${(error as Error).message}`);
  }
}

ensureContentDir()
  .then(validatePosts)
  .catch((error) => {
    console.error('validatePosts failed:', error);
    process.exitCode = 1;
  });
