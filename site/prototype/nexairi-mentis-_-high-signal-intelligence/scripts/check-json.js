import fs from 'node:fs';
import path from 'node:path';

const postsPath = path.resolve(process.cwd(), 'public', 'posts.json');

try {
  const raw = fs.readFileSync(postsPath, 'utf8');
  JSON.parse(raw);
  console.log('✅ public/posts.json is valid JSON.');
  process.exit(0);
} catch (err) {
  console.error('✖ public/posts.json failed to parse as JSON.');
  console.error(err && err.message ? err.message : err);
  process.exit(1);
}
