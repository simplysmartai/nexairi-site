import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export interface ArticleFile {
  filename: string;
  slug: string;
  frontmatter: Record<string, unknown>;
  body: string;
  absolutePath: string;
}

const FRONTMATTER_PATTERN = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*/;
export const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'content');

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, '');
}

export function parseFrontmatter(source: string): { frontmatter: Record<string, unknown>; body: string } {
  const text = stripBom(source);
  const match = text.match(FRONTMATTER_PATTERN);
  if (!match) {
    return { frontmatter: {}, body: text.trimStart() };
  }
  try {
    const data = parseYaml(match[1]) as Record<string, unknown> | null;
    return {
      frontmatter: data ?? {},
      body: text.slice(match[0].length).trimStart(),
    };
  } catch (error) {
    console.warn('⚠️  Failed to parse frontmatter. Returning raw content.', error);
    return { frontmatter: {}, body: text.slice(match[0].length).trimStart() };
  }
}

export function serializeFrontmatter(frontmatter: Record<string, unknown>): string {
  const yaml = stringifyYaml(frontmatter, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---`;
}

export function articleFilenameFromSlug(slug: string): string {
  return slug.endsWith('.html') ? slug : `${slug}.html`;
}

export async function readArticle(slugOrFilename: string): Promise<ArticleFile> {
  const filename = articleFilenameFromSlug(slugOrFilename);
  const absolutePath = path.resolve(CONTENT_DIR, filename);
  const raw = await fs.readFile(absolutePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  const slug = (frontmatter.slug as string) ?? filename.replace(/\.html$/, '');
  return { filename, slug, frontmatter, body, absolutePath };
}

export async function writeArticle(article: ArticleFile): Promise<void> {
  const fm = serializeFrontmatter(article.frontmatter);
  const next = `${fm}\n\n${article.body.trim()}\n`;
  await fs.writeFile(article.absolutePath, next, 'utf8');
}

export async function listArticleFilenames(): Promise<string[]> {
  const entries = await fs.readdir(CONTENT_DIR);
  return entries.filter((entry) => entry.endsWith('.html'));
}
