#!/usr/bin/env node
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const topic = process.argv[2];
const genreArg = process.argv[3] || 'Sports';

const genres = {
  Sports: `Write COMPLETE Nexairi Sports JSON article "${topic}":
SCHEMA:
{
  "id": "${topic.toLowerCase().replace(/[^a-z0-9]/g,'-')}-${Date.now()}",
  "
}

if (!topic) {
  console.log('Usage: npm run generate:article "Bowl Season Guide" [Sports|Technology|Lifestyle|Travel]');
  process.exit(1);
}

const slug = topic.toLowerCase().replace(/[^a-z0-9]/g, '-');
const id = `${slug}-${Date.now()}`;
const date = new Date().toISOString().split('T')[0];
const contentPath = `/content/${genreArg.toLowerCase()}/${slug}.html`;

const prompts = {
  Sports: `Write COMPLETE Nexairi Sports JSON article "${topic}":
{
  "id": "${id}",
  "title": "${topic}",
  "slug": "${slug}",
  "category": "Sports",
  "subCategory": "${topic.includes('NFL') ? 'NFL' : topic.includes('NCAA') ? 'College Football' : 'Pro Sports'}",
  "contentType": "feature",
  "tldr": "Latest ${topic.toLowerCase()} analysis with standings, key matchups, player streaks.",
  "date": "${date}",
  "tags": ["sports", "${topic.split(' ')[0].toLowerCase()}", "2025"],
  "contentPath": "${contentPath}",
  "contentHtml": "<h1>${topic}</h1><!-- RESEARCH + WRITE FULL ARTICLE: standings table, matchups, streaks, next games. ESPN voice, 1500 words -->"
}

RESEARCH first, then write. ESPN sharp voice.`,
  
  Technology: `Write COMPLETE Nexairi Technology JSON article "${topic}":
{
  "id": "${id}",
  "title": "${topic}",
  "slug": "${slug}",
  "category": "Technology",
  "subCategory": "${topic.includes('AI') ? 'AI' : 'Gadgets'}",
  "contentType": "feature",
  "tldr": "Deep ${topic.toLowerCase()} review with benchmarks, pricing, alternatives.",
  "date": "${date}",
  "tags": ["technology", "${topic.split(' ')[0].toLowerCase()}"],
  "contentPath": "${contentPath}",
  "contentHtml": "<h1>${topic}</h1><!-- SPECS TABLE, BENCHMARKS, PRICING, PROS/CONS. Wired voice, 1400 words -->"
}`,

  Lifestyle: `Write COMPLETE Nexairi Lifestyle JSON article "${topic}":
{
  "id": "${id}",
  "title": "${topic}",
  "slug": "${slug}",
  "category": "Lifestyle",
  "subCategory": "habits",
  "contentType": "feature",
  "tldr": "Practical ${topic.toLowerCase()} guide with 5 actionable steps.",
  "date": "${date}",
  "tags": ["lifestyle", "${topic.split(' ')[0].toLowerCase()}"],
  "contentPath": "${contentPath}",
  "contentHtml": "<h1>${topic}</h1><!-- 5 STEPS LIST, PRODUCT RECS WITH PRICES, Goop voice, 1300 words -->"
}`,

  Travel: `Write COMPLETE Nexairi Travel JSON article "${topic}":
{
  "id": "${id}",
  "title": "${topic}",
  "slug": "${slug}",
  "category": "Travel",
  "subCategory": "destinations",
  "contentType": "feature",
  "tldr": "Complete ${topic.toLowerCase()} itinerary with costs, hotels, restaurants.",
  "date": "${date}",
  "tags": ["travel", "${topic.split(' ')[0].toLowerCase()}"],
  "contentPath": "${contentPath}",
  "contentHtml": "<h1>${topic}</h1><!-- 3-DAY ITINERARY TABLE, HOTEL/FLIGHT PRICES, Condé Nast voice, 1600 words -->"
}`
};

const prompt = prompts[genreArg as keyof typeof prompts] || prompts.Sports;

console.log(`🎯 ${genreArg}: "${topic}"`);

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' }
});

const json = JSON.parse(completion.choices[0]!.message.content!);
const filename = `drafts/${slug}-${Date.now()}.json`;

fs.mkdirSync('drafts', { recursive: true });
fs.writeFileSync(filename, JSON.stringify(json, null, 2));

console.log(`✅ ${filename}`);
console.log(`🚀 npm run ingest:article -- "${filename}"`);
console.log(`🌐 npm run dev  # preview locally`);

