import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const POSTS_PATH = path.join(PUBLIC_DIR, 'posts.json');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const BASE_URL = 'https://nexairi.com'; // Replace with your actual domain

console.log('Generating sitemap...');

try {
  if (!fs.existsSync(POSTS_PATH)) {
    console.warn('No posts.json found, skipping sitemap generation.');
    process.exit(0);
  }

  const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
  
  const urls = posts.map(post => {
    return `
  <url>
    <loc>${BASE_URL}/article/${post.category}/${post.slug}</loc>
    <lastmod>${post.date || new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${post.isFeatured ? '0.9' : '0.7'}</priority>
  </url>`;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/mission</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>${urls}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, sitemap);
  console.log(`Sitemap generated at ${SITEMAP_PATH} with ${posts.length} URLs.`);

} catch (error) {
  console.error('Error generating sitemap:', error);
}