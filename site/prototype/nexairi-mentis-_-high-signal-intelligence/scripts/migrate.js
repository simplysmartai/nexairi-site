import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
// Resolve paths relative to this script file to ensure it works from any execution context
const POSTS_DIR = path.join(__dirname, '../site/posts'); 
const OUTPUT_FILE = path.join(__dirname, '../public/posts.json');

// Helper to extract data from HTML string using Regex (avoids needing external dependencies)
function parseHtmlFile(content, filename) {
  // 1. Title (Extracts from <title> or <h1>)
  const titleMatch = content.match(/<title>(.*?)<\/title>/i) || content.match(/<h1>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(' - Nexairi', '').trim() : 'Untitled Post';

  // 2. Date (Looks for common date patterns)
  const dateMatch = content.match(/(\w{3} \d{1,2}, \d{4})/); // e.g., Oct 25, 2023
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // 3. Category (Inferred from folder name or meta tag, defaulting to Technology)
  let category = 'Technology';
  if (content.toLowerCase().includes('lifestyle')) category = 'Lifestyle';
  if (content.toLowerCase().includes('travel')) category = 'Travel';
  if (content.toLowerCase().includes('sports')) category = 'Sports';

  // 4. Image (Finds the first image tag)
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  let imageUrl = imgMatch ? imgMatch[1] : 'https://picsum.photos/seed/tech/800/600';

  // Normalize local paths to /Images/ based on new user preference
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
    const filename = imageUrl.split('/').pop();
    imageUrl = `/Images/${filename}`;
  }

  // 5. Excerpt (First paragraph)
  const pMatch = content.match(/<p>(.*?)<\/p>/);
  const excerpt = pMatch ? pMatch[1].replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : 'Click to read more.';

  return {
    id: filename.replace('.html', ''),
    title: title,
    slug: filename.replace('.html', ''),
    excerpt: excerpt,
    category: category,
    author: 'Nexairi AI', // Default author
    date: date,
    imageUrl: imageUrl,
    content: content // We store the full HTML to render it if needed
  };
}

function migrate() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Error: Could not find directory ${POSTS_DIR}`);
    console.log("Please ensure your legacy posts are located in site/posts/");
    return;
  }

  const files = fs.readdirSync(POSTS_DIR);
  const posts = [];

  console.log(`Found ${files.length} files. Processing...`);

  files.forEach(file => {
    if (path.extname(file) === '.html') {
      const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
      const postData = parseHtmlFile(content, file);
      posts.push(postData);
      console.log(`Converted: ${postData.title}`);
    }
  });

  // Sort by Date (Approximation)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Write to public folder
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`\nSUCCESS! Migration complete.`);
  console.log(`Generated ${OUTPUT_FILE} with ${posts.length} posts.`);
}

migrate();