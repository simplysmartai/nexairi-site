import { promises as fs } from 'node:fs';
import path from 'node:path';
import { validatePostShape, normalizeCategory } from '../src/utils/postSchema';

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/ingest-article.js <draft-json-path>');
    process.exit(1);
  }

  const repoRoot = process.cwd();
  const draftPath = path.isAbsolute(arg) ? arg : path.resolve(repoRoot, arg);

  try {
    const raw = await fs.readFile(draftPath, 'utf8');
    const draft = JSON.parse(raw) as any;

    if (!draft || typeof draft !== 'object') {
      throw new Error('Draft JSON did not parse to an object.');
    }

    const contentHtml = draft.contentHtml as string | undefined;
    if (!contentHtml) {
      throw new Error('Draft JSON missing required `contentHtml` property.');
    }

    // Basic validation
    const validation = validatePostShape(draft);
    if (!validation.valid) {
      throw new Error('Draft validation failed: ' + validation.errors.join('; '));
    }

    // Determine normalized category and output path for the HTML file
    const normalizedCategory = normalizeCategory(draft.category) || normalizeCategory(draft.categoryName) || null;
    if (!normalizedCategory) {
      throw new Error('Unable to normalize category. Allowed: Lifestyle, Technology, Travel, Sports');
    }
    const genreFolder = String(normalizedCategory).toLowerCase().replace(/\s+/g, '-');

    // Decide slug
    const slug = draft.slug || draft.id || 'untitled';
    const safeSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9\-_.]/g, '-');

    // Build contentPath as site-relative: /content/<genre>/<slug>.html
    const contentPath = path.posix.join('content', genreFolder, `${safeSlug}.html`);

    // Resolve final output path under public/
    const outPath = path.resolve(repoRoot, 'public', contentPath);
    const outDir = path.dirname(outPath);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outPath, contentHtml, 'utf8');
    console.log(`✅ Wrote article HTML to ${path.relative(repoRoot, outPath)}`);

    // Remove contentHtml from metadata before inserting into posts.json
    const metadata = { ...draft };
    delete metadata.contentHtml;

    // Normalize contentPath in metadata to the path used on the site (leading slash)
    metadata.contentPath = '/' + contentPath.split(path.sep).join('/');
    // Ensure category is normalized
    metadata.category = normalizedCategory;
    // Remove old contentFile if present
    if (metadata.contentFile) delete metadata.contentFile;

    // Load posts.json
    const postsJsonPath = path.resolve(repoRoot, 'public', 'posts.json');
    let posts: any[] = [];
    try {
      const postsRaw = await fs.readFile(postsJsonPath, 'utf8');
      posts = JSON.parse(postsRaw) as any[];
      if (!Array.isArray(posts)) throw new Error('posts.json is not an array');
    } catch (err: any) {
      // If file missing, start with empty array
      if (err.code === 'ENOENT') {
        console.log('ℹ️  posts.json not found, creating a new one.');
        posts = [];
      } else {
        throw err;
      }
    }

    // Insert metadata at the top
    posts.unshift(metadata);

    // Write back posts.json (pretty-printed)
    await fs.writeFile(postsJsonPath, JSON.stringify(posts, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated posts.json and added post with id/slug: ${metadata.id || metadata.slug}`);
  } catch (err: any) {
    console.error('✖️  Ingest failed:', err.message || err);
    process.exit(1);
  }
}

// Run the script when invoked directly (ESM-friendly)
main().catch((err) => {
  console.error('✖️  Ingest failed:', err);
  process.exit(1);
});

export {};
