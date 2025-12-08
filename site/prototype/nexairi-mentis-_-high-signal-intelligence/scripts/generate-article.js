#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateArticle(topic) {
  console.log(`🔍 Generating "${topic}"...`);
  
  const prompt = `Generate ONE JSON object for Nexairi Sports article "${topic}":
{
  "id": "${topic.toLowerCase().replace(/[^a-z0-9]/g,'-')}-${Date.now()}",
  "title": "${topic}",
  "slug": "${topic.toLowerCase().replace(/[^a-z0-9]/g,'-')}",
  "category": "Sports",
  "subCategory": "College Football",
  "contentType": "bowl-guide",
  "tldr": "Complete guide to ${topic.toLowerCase()}",
  "date": "${new Date().toISOString().split('T')[0]}",
  "tags": ["sports", "college football", "bowl season", "2025-26"],
  "contentPath": "/content/sports/${topic.toLowerCase().replace(/[^a-z0-9]/g,'-')}.html",
  "contentHtml": "<h1>${topic}</h1><p>Full professional article HTML here with researched bowl games, dates, times, channels, team previews, and bowl histories...</p>"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  const json = JSON.parse(completion.choices[0].message.content);
  const filename = `drafts/${topic.toLowerCase().replace(/[^a-z0-9]/g,'-')}-${Date.now()}.json`;
  const filepath = path.join(__dirname, '..', filename);
  
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(json, null, 2));
  
  console.log(`✅ Created: ${filename}`);
  console.log(`📋 Next: npm run ingest:article -- "${filename}"`);
}

const topic = process.argv[2];
if (!topic) {
  console.log('Usage: node scripts/generate-article.js "Bowl Season Guide Part 1"');
  process.exit(1);
}

generateArticle(topic).catch(console.error);
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai'); // npm i openai

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateArticle(topic) {
  const prompt = `Generate ONE JSON object for Nexairi matching this exact schema:
{
  "id": "unique-${Date.now()}",
  "title": "...",
  "slug": "...",
  "category": "Sports",
  "subCategory": "College Football",
  "contentType": "bowl-guide",
  "tldr": "...",
  "date": "${new Date().toISOString().split('T')[0]}",
  "tags": [...],
  "contentPath": "/content/sports/${topic.toLowerCase().replace(/[^a-z0-9]/g,'-')}.html",
  "contentHtml": "<h1>Full HTML article here</h1>..."
}

Topic: "${topic}"
Write a professional ${topic} article.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  const json = JSON.parse(completion.choices[0].message.content);
  const filename = `drafts/${topic.toLowerCase().replace(/[^a-z0-9]/g,'-')}-${Date.now()}.json`;
  
  fs.writeFileSync(path.join(__dirname, '..', filename), JSON.stringify(json, null, 2));
  console.log(`✅ Created ${filename}`);
  console.log(`Next: npm run ingest:article -- ${filename}`);
}

const topic = process.argv[2];
if (!topic) {
  console.log('Usage: node scripts/generate-article.js "Bowl Season Guide Part 1"');
  process.exit(1);
}

generateArticle(topic).catch(err => {
  console.error('Error generating article:', err);
  process.exit(1);
});
