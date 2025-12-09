#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { OpenAI } from 'openai';

async function main() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const topic = process.argv[2];
  const genre = process.argv[3] || 'Technology';

  if (!topic) {
    console.log('Usage: npm run generate:article "Article Title" [Sports|Technology|Lifestyle|Travel]');
    process.exit(1);
  }

  const slug = topic.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const timestamp = Date.now();
  const id = `${slug}-${timestamp}`;
  const date = new Date().toISOString().split('T')[0];
  const contentPath = `/content/${genre.toLowerCase()}/${slug}.html`;
  const filename = `drafts/${slug}-${timestamp}.json`;

  console.log(`🎯 Generating "${topic}" (${genre})...`);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Write COMPLETE Nexairi ${genre} JSON "${topic}" with ALL fields:

{
  "id": "${id}",
  "title": "${topic}",
  "slug": "${slug}",
  "category": "${genre}",
  "subCategory": "${genre}",
  "contentType": "feature",
  "tldr": "3 sentence hook.",
  "date": "${date}",
  "author": "Jackson S.",
  "summary": "150 char SEO description.",
  "excerpt": "50 word teaser.",
  "readingTime": 8,
  "imageUrl": "/images/${genre.toLowerCase()}/${slug}.jpg",
  "tags": ["${genre.toLowerCase()}", "${topic.split(' ')[0].toLowerCase()}"],
  "contentFile": "${contentPath}",
  "contentPath": "${contentPath}",
  "contentHtml": "<h1>${topic}</h1><p>1500 word article with tables</p>"
}`
    }],
    response_format: { type: 'json_object' }
  });

  let json = JSON.parse(completion.choices[0].message.content!);
  
  json.summary ||= `Discover ${topic} - latest ${genre.toLowerCase()} insights.`;
  json.excerpt ||= `${topic} explained simply with key takeaways.`;
  json.author ||= 'Jackson S.';
  json.contentFile = contentPath;
  json.readingTime = 8;

  fs.mkdirSync('drafts', { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(json, null, 2));

  console.log(`✅ ${filename}`);
  
  // AUTO INGEST
  console.log('🔥 AUTO-INGESTING...');
  execSync(`npx tsx scripts/ingest-article.ts "${filename}"`, { stdio: 'inherit' });
  
  console.log('✅ VALIDATED & LIVE');
  console.log('🌐 npm run dev');
}

main().catch(console.error);

