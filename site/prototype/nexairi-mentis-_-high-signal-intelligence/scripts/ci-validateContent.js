const fs = require('fs');
const path = require('path');

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assert(cond, message) {
  if (!cond) {
    console.error('ERROR:', message);
    process.exitCode = 2;
  }
}

async function main() {
  const root = process.cwd();
  const postsFile = path.resolve(root, 'public', 'posts.json');
  if (!fs.existsSync(postsFile)) {
    console.error('posts.json not found at', postsFile);
    process.exit(2);
  }

  const posts = readJson(postsFile);
  if (!Array.isArray(posts)) {
    console.error('posts.json is not an array');
    process.exit(2);
  }

  const sample = posts.slice(0, 6);
  let hadError = false;

  for (const p of sample) {
    const id = p.id || p.slug || '<unknown>';
    if (!p.contentFile) {
      console.error(`Post ${id} missing contentFile`);
      hadError = true;
      continue;
    }
    const contentPath = path.resolve(root, 'public', p.contentFile.replace(/^[\/]/, ''));
    if (!fs.existsSync(contentPath)) {
      console.error(`Post ${id} content file not found: ${p.contentFile}`);
      hadError = true;
      continue;
    }
    const raw = fs.readFileSync(contentPath, 'utf8');
    const plain = stripHtml(raw);
    if (!/<h1[^>]*>/.test(raw)) {
      console.error(`Post ${id} missing <h1> in content`);
      hadError = true;
    }
    if (plain.length < 200) {
      console.error(`Post ${id} content too short (${plain.length} chars)`);
      hadError = true;
    }
    const isWeekly = /week|weekly|recap/i.test(p.slug || '');
    if (isWeekly && plain.length < 1800) {
      console.error(`Post ${id} looks like a weekly recap but is too short (${plain.length} chars)`);
      hadError = true;
    }
    if (!p.imageUrl || typeof p.imageUrl !== 'string') {
      console.error(`Post ${id} missing imageUrl in index`);
      hadError = true;
    }
  }

  if (hadError) {
    console.error('CI content validation failed. See errors above.');
    process.exit(2);
  }

  console.log('CI content validation passed for sample posts.');
}

main().catch((err) => {
  console.error('ci-validateContent failed:', err);
  process.exit(2);
});
