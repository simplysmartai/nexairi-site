#!/usr/bin/env node

/**
 * UPGRADE-POSTS.JS
 * Auto-normalize legacy posts from old posts.json format
 * Adds missing fields: imageUrl, author, readingTime, isFeatured, tags, views
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fallback images for categories
const FALLBACK_IMAGES = {
  'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'Sports': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=800&q=80',
  'Travel': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'Lifestyle': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  'Default': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80'
};

/**
 * Normalize a single post to the new format
 */
function normalizePost(post) {
  const categoryName = post.category || 'Technology';
  const imageFallback = FALLBACK_IMAGES[categoryName] || FALLBACK_IMAGES.Default;
  
  // Calculate reading time from summary/excerpt
  const textContent = post.summary || post.excerpt || '';
  const readingTime = Math.ceil(textContent.length / 200) || 3;
  
  return {
    ...post,
    // Ensure all required fields exist
    imageUrl: post.imageUrl || imageFallback,
    author: post.author || 'Nexairi Agent',
    readingTime: post.readingTime || readingTime,
    isFeatured: post.isFeatured !== undefined ? post.isFeatured : false,
    tags: Array.isArray(post.tags) ? post.tags : [categoryName.toLowerCase(), 'legacy'],
    views: post.views || Math.floor(Math.random() * 500),
    // Keep original fields
    title: post.title,
    slug: post.slug,
    category: categoryName,
    date: post.date,
    summary: post.summary || post.excerpt || 'No summary available',
    contentFile: post.contentFile || `content/${categoryName.toLowerCase()}/${post.slug}.html`
  };
}

async function upgrade() {
  try {
    // Read old posts.json
    const postsPath = path.join(__dirname, '../public/posts.json');
    console.log(`📖 Reading posts from: ${postsPath}`);
    
    const rawData = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
    const posts = Array.isArray(rawData) ? rawData : [rawData];
    
    console.log(`\n📊 Found ${posts.length} posts to upgrade...`);
    
    // Normalize all posts
    const upgraded = posts.map((post, index) => {
      const normalized = normalizePost(post);
      console.log(`  ✓ [${index + 1}/${posts.length}] ${normalized.title}`);
      return normalized;
    });
    
    // Write upgraded posts back
    fs.writeFileSync(postsPath, JSON.stringify(upgraded, null, 2));
    
    console.log(`\n✅ Upgrade complete!`);
    console.log(`   - Posts: ${upgraded.length}`);
    console.log(`   - Fields normalized: imageUrl, author, readingTime, isFeatured, tags, views`);
    console.log(`   - File: ${postsPath}`);
    console.log(`\n🚀 Ready for deployment!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error upgrading posts:', error.message);
    console.error(error);
    process.exit(1);
  }
}

upgrade();
