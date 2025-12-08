#!/usr/bin/env node
import 'dotenv/config';
import { OpenAI } from 'openai';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface ArticleRequest {
  topic: string;
  category?: 'Sports' | 'Technology' | 'Travel' | 'Lifestyle';
  tone?: 'conversational' | 'analytical' | 'narrative';
}

const CATEGORY_DEFAULTS = {
  Sports: { folder: 'sports', tags: ['sports', 'analysis'], tone: 'conversational' },
  Technology: { folder: 'technology', tags: ['technology', 'innovation'], tone: 'analytical' },
  Travel: { folder: 'travel', tags: ['travel', 'guide'], tone: 'narrative' },
  Lifestyle: { folder: 'lifestyle', tags: ['lifestyle', 'wellbeing'], tone: 'conversational' },
};

async function generateArticle(req: ArticleRequest): Promise<void> {
  const { topic, category = 'Sports' } = req;
  const config = CATEGORY_DEFAULTS[category];
  const slug = topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60);
  const id = `${slug}-${Date.now()}`;
  const date = new Date().toISOString().split('T')[0];

  console.log(`🔍 Generating article: "${topic}" (${category})`);

  // Step 1: Research prompt (Perplexity-style)
  const researchPrompt = buildResearchPrompt(topic, category);
  console.log('📚 Researching...');
  const research = await callOpenAI(researchPrompt, 1500);

  // Step 2: Writing prompt (OpenAI)
  const writePrompt = buildWritePrompt(topic, category, research, config);
  console.log('✍️ Writing article...');
  const articleHtml = await callOpenAI(writePrompt, 3000);

  // Step 3: Create JSON draft
  const wrappedHtml = wrapHtmlWithFrontmatter(topic, slug, date, articleHtml, config);
  const draft = {
    id,
    title: topic,
    slug,
    date,
    author: `Nexairi ${category}`,
    category,
    summary: extractSummary(topic, 160),
    excerpt: generateExcerpt(articleHtml, topic, 200),
    imageUrl: `/images/posts/${slug}.jpg`,
    tags: config.tags,
    contentPath: `/content/${config.folder}/${slug}.html`,
    contentHtml: wrappedHtml,
  };

  // Step 4: Save draft JSON
  const draftDir = path.resolve(process.cwd(), 'drafts');
  await fs.mkdir(draftDir, { recursive: true });
  const draftPath = path.join(draftDir, `${slug}-${Date.now()}.json`);
  await fs.writeFile(draftPath, JSON.stringify(draft, null, 2), 'utf8');
  console.log(`📝 Saved draft: ${draftPath}`);

  // Step 5: Ingest
  console.log('🔧 Ingesting into posts.json...');
  await runCommand('npm', ['run', 'ingest:article', '--', `"${draftPath}"`]);

  // Step 6: Validate
  console.log('✅ Validating...');
  await runCommand('npm', ['run', 'validate-posts']);
  await runCommand('npm', ['run', 'check-json']);

  console.log(`✨ Article ready! Draft: ${draftPath}`);
  console.log(`Next: Review, then run: git add public/posts.json public/content/${config.folder}/${slug}.html; git commit; git push`);
}

function buildResearchPrompt(topic: string, category: string): string {
  return `You are a research expert. For the topic "${topic}" in the ${category} category, provide:
1. Key facts, recent developments, and context
2. Notable figures, products, or events
3. Perspectives from multiple angles
4. Interesting insights that a general audience would find valuable

Format: Provide 3-5 bullet points with specific, sourced information. Be conversational and accessible.`;
}

function buildWritePrompt(
  topic: string,
  category: string,
  research: string,
  config: (typeof CATEGORY_DEFAULTS)[keyof typeof CATEGORY_DEFAULTS]
): string {
  const tone = {
    conversational: 'Friendly, engaging, like talking to a knowledgeable friend.',
    analytical: 'Clear, logical, breaking down concepts for beginners.',
    narrative: 'Vivid, descriptive, painting a picture for the reader.',
  }[config.tone];

  return `Write a professional ${topic} article for Nexairi.
Tone: ${tone}
Audience: Curious common people who want to learn but aren't experts in the subject.

Research findings:
${research}

Article requirements:
- 1200-1800 words
- Start with a hook that explains why this matters to everyday people
- Use clear headings and short paragraphs
- Define jargon in simple terms
- End with a "takeaway" section
- Use conversational language (contractions OK, avoid corporate jargon)
- Cite sources briefly inline (e.g., "According to [Source]...")

HTML structure:
<article>
  <h1>${topic}</h1>
  <p class="intro">Hook paragraph...</p>
  <section><h2>Section 1</h2>...</section>
  <section><h2>Key Takeaway</h2>...</section>
</article>`;
}

async function callOpenAI(prompt: string, maxTokens: number): Promise<string> {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return response.choices[0]?.message.content || '';
}

function extractSummary(topic: string, maxLen: number): string {
  const base = `A comprehensive guide to ${topic}.`;
  return base.length <= maxLen ? base : base.slice(0, maxLen - 3) + '...';
}

function extractTextFromHtml(html: string): string {
  // Simple extraction: remove HTML tags, trim whitespace
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text;
}

function generateExcerpt(html: string, topic: string, maxLen: number): string {
  const text = extractTextFromHtml(html);
  if (!text) return extractSummary(topic, maxLen);
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen - 3) + '...';
  return truncated;
}

function wrapHtmlWithFrontmatter(
  title: string,
  slug: string,
  date: string,
  html: string,
  config: (typeof CATEGORY_DEFAULTS)[keyof typeof CATEGORY_DEFAULTS]
): string {
  const frontmatter = `---
title: "${title}"
slug: "${slug}"
date: "${date}T00:00:00.000Z"
author: "Nexairi"
category: "${Object.keys(CATEGORY_DEFAULTS).find(k => CATEGORY_DEFAULTS[k as keyof typeof CATEGORY_DEFAULTS] === config)}"
tags:
  - ${config.tags.join('\n  - ')}
imagePrompt: "Editorial illustration for ${title}, professional, accessible, 1600x900"
imageAlt: "${title}"
---

${html}`;
  return frontmatter;
}

function runCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error(`Command ${cmd} exited with code ${code}`));
      else resolve();
    });
  });
}

const args = process.argv.slice(2);
if (!args[0]) {
  console.log('Usage: npm run create:article "Topic" [Category] [Tone]');
  console.log('Example: npm run create:article "AI in Healthcare" Technology');
  process.exit(1);
}

generateArticle({
  topic: args[0],
  category: (args[1] as any) || 'Sports',
  tone: (args[2] as any) || 'conversational',
}).catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
