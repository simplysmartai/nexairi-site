import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FALLBACK_POST_IMAGE } from '../constants/media.ts';
import { listArticleFilenames, readArticle } from './lib/content';

interface ReviewItem {
  slug: string;
  filename: string;
  reasons: string[];
  severity: number;
}

const REPORT_DIR = path.resolve(process.cwd(), 'reports', 'review');

function parseArgs(): { json: boolean; limit?: number } {
  const args = process.argv.slice(2);
  let json = false;
  let limit: number | undefined;
  for (const arg of args) {
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const value = Number(arg.split('=')[1]);
      if (!Number.isNaN(value)) {
        limit = value;
      }
    }
  }
  return { json, limit };
}

function collectIssues(articleBody: string, frontmatter: Record<string, unknown>): string[] {
  const issues: string[] = [];
  if (!frontmatter.metaDescription) {
    issues.push('Missing meta description');
  }
  if (!frontmatter.heroAlt) {
    issues.push('Missing hero alt text');
  }
  const imageUrl = String(frontmatter.imageUrl ?? '');
  if (!imageUrl || imageUrl === FALLBACK_POST_IMAGE || /source\.unsplash\.com/i.test(imageUrl)) {
    issues.push('Hero uses fallback art');
  }
  if (!/nx-inline-image/.test(articleBody)) {
    issues.push('No inline figures detected');
  }
  if (frontmatter.affiliateDisclosure && !/affiliate-disclosure/.test(articleBody)) {
    issues.push('Affiliate disclosure missing');
  }
  const summary = String(frontmatter.summary ?? '');
  if (summary.length < 80) {
    issues.push('Summary too short (<80 chars)');
  }
  return issues;
}

function computeSeverity(reasons: string[]): number {
  return reasons.length;
}

async function main() {
  const { json, limit } = parseArgs();
  const filenames = await listArticleFilenames();
  const queue: ReviewItem[] = [];
  for (const filename of filenames) {
    const article = await readArticle(filename);
    const reasons = collectIssues(article.body, article.frontmatter);
    if (reasons.length === 0) continue;
    queue.push({
      slug: article.slug,
      filename: article.filename,
      reasons,
      severity: computeSeverity(reasons),
    });
  }
  queue.sort((a, b) => b.severity - a.severity || a.slug.localeCompare(b.slug));
  const slice = typeof limit === 'number' ? queue.slice(0, limit) : queue;
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const outPath = path.join(
    REPORT_DIR,
    `review-queue-${new Date().toISOString().replace(/[:]/g, '-')}.json`,
  );
  await fs.writeFile(outPath, JSON.stringify(slice, null, 2), 'utf8');
  if (json) {
    console.log(JSON.stringify(slice, null, 2));
  } else {
    if (slice.length === 0) {
      console.log('🎉 Review queue empty.');
    } else {
      console.log('🧍 Human review needed:');
      slice.forEach((item) => {
        console.log(`- ${item.slug} (${item.reasons.join('; ')})`);
      });
    }
    console.log(`Saved queue → ${path.relative(process.cwd(), outPath)}`);
  }
  console.log('Next command: npm run image-agent');
}

main().catch((error) => {
  console.error('humanReviewQueue agent failed:', error);
  process.exit(1);
});
