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

    // Decide slug and id (normalized)
    const rawSlug = draft.slug || draft.id || 'untitled';
    const safeSlug = String(rawSlug).toLowerCase().trim().replace(/[^a-z0-9\-_.]/g, '-');
    const postId = draft.id || safeSlug;

    // Build contentPath as site-relative: content/<genre>/<slug>.html (posix separators)
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

    // Normalize date and author for posts.json to match index expectations
    try {
      const d = new Date(draft.date || draft.dateString || Date.now());
      metadata.date = Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } catch (err) {
      metadata.date = new Date().toISOString();
    }
    metadata.author = metadata.author || 'Nexairi Editorial';
    // Normalize contentFile in metadata to the path used on the site (no leading slash)
    metadata.contentFile = contentPath; // already posix
    // Ensure category is normalized
    metadata.category = normalizedCategory;
    // Ensure slug and id normalized
    metadata.slug = String(safeSlug);
    metadata.id = String(postId);
    // Remove old contentPath if present
    if (metadata.contentPath) delete metadata.contentPath;

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

    // Check for duplicate id/slug in current posts.json
    const conflict = posts.find((p) => (p.id && p.id === metadata.id) || (p.slug && p.slug === metadata.slug));
    if (conflict) {
      // Create diagnostic report for maintainers
      const reportsDir = path.resolve(repoRoot, 'reports', 'generate');
      await fs.mkdir(reportsDir, { recursive: true });
      const reportPath = path.resolve(reportsDir, `duplicate-${metadata.slug}.json`);
      const report = {
        error: 'duplicate-id-or-slug',
        message: `Post id or slug already exists in posts.json: id=${metadata.id} slug=${metadata.slug}`,
        existing: conflict,
        incoming: metadata,
        timestamp: new Date().toISOString(),
      };
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
      throw new Error(`Duplicate post id/slug detected. Wrote diagnostic: ${path.relative(repoRoot, reportPath)}`);
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
