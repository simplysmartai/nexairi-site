import { promises as fs } from 'node:fs';
import path from 'node:path';

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
  tags: unknown;
  contentFile: string;
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

async function validateContentFile(relativePath: string): Promise<boolean> {
  const fullPath = path.resolve(PUBLIC_DIR, relativePath);
  try {
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      throw new Error('not a file');
    }
    return true;
  } catch {
    return false;
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

    if (!post.author || typeof post.author !== 'string') {
      trackIssue(issues, 'warning', `${prefix}: author missing.`);
    }

    if (!post.date || typeof post.date !== 'string') {
      trackIssue(issues, 'error', `${prefix}: missing date.`);
    } else if (!isIsoDate(post.date)) {
      trackIssue(issues, 'error', `${prefix}: invalid ISO date '${post.date}'.`);
    }

    if (!Array.isArray(post.tags)) {
      trackIssue(issues, 'error', `${prefix}: tags must be an array.`);
    }

    if (!post.contentFile || typeof post.contentFile !== 'string') {
      trackIssue(issues, 'error', `${prefix}: missing contentFile.`);
    } else {
      // eslint-disable-next-line no-await-in-loop
      const exists = await validateContentFile(post.contentFile);
      if (!exists) {
        trackIssue(issues, 'error', `${prefix}: content file not found (${post.contentFile}).`);
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
