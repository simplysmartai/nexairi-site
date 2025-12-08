import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { enforceAffiliateCompliance } from '../utils/affiliate.ts';

interface FrontmatterPayload {
  data: Record<string, unknown> | null;
  body: string;
}

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.resolve(ROOT_DIR, 'public', 'content');

function extractFrontmatter(source: string): FrontmatterPayload {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*/);
  if (match) {
    try {
      const data = parseYaml(match[1]) as Record<string, unknown> | undefined;
      const body = source.slice(match[0].length);
      return { data: data ?? {}, body };
    } catch (error) {
      console.warn('Failed to parse YAML frontmatter, leaving content untouched. Error:', error);
    }
  }
  return { data: null, body: source };
}

function buildFrontmatter(data: Record<string, unknown>): string {
  const yaml = stringifyYaml(data, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n\n`;
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
      if (['.html', '.htm', '.md', '.mdx', '.markdown'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

async function processFile(filePath: string): Promise<{ updated: boolean; affiliateLinks: number }> {
  const original = await fs.readFile(filePath, 'utf8');
  const { data, body } = extractFrontmatter(original);
  const compliance = enforceAffiliateCompliance(body);

  if (compliance.affiliateLinks === 0 && !compliance.disclosureInserted) {
    return { updated: false, affiliateLinks: 0 };
  }

  let next = compliance.html;
  if (data) {
    if (compliance.affiliateLinks > 0) {
      data.affiliateDisclosure = true;
    }
    next = `${buildFrontmatter(data)}${next.trimStart()}`;
  }

  const normalized = `${next.trimEnd()}\n`;
  const currentNormalized = `${original.trimEnd()}\n`;
  if (normalized === currentNormalized) {
    return { updated: false, affiliateLinks: compliance.affiliateLinks };
  }

  await fs.writeFile(filePath, normalized, 'utf8');
  return { updated: true, affiliateLinks: compliance.affiliateLinks };
}

async function main(): Promise<void> {
  const files = await collectContentFiles(CONTENT_DIR);
  if (!files.length) {
    console.warn('No content files detected.');
    return;
  }

  let updatedFiles = 0;
  let totalLinks = 0;

  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const result = await processFile(file);
    if (result.updated) {
      updatedFiles += 1;
      totalLinks += result.affiliateLinks;
      console.log(`✅ Updated ${path.relative(ROOT_DIR, file)} (${result.affiliateLinks} links normalized)`);
    }
  }

  if (updatedFiles === 0) {
    console.log('All content already meets affiliate compliance.');
  } else {
    console.log(`✨ Affiliate compliance enforced for ${updatedFiles} file(s); ${totalLinks} Amazon link(s) standardized.`);
  }
}

main().catch((error) => {
  console.error('enforceAffiliateCompliance failed:', error);
  process.exit(1);
});
