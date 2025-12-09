import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory: string;
  contentType: string;
  tldr: string;
  date: string;
  readingTime: number;
  imageUrl: string;
  tags: string[];
  contentPath: string;
  author: string;
  summary: string;
  excerpt: string;
  contentHtml: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function research(topic: string, category: string): Promise<string> {
  console.log(`\n📰 1/5 Research: Gathering facts and sources for "${topic}"...`);

  const prompt = `Research and provide factual information for an article about "${topic}" in the ${category} category.
  
Return a JSON object with:
- facts: array of 8-10 key facts with sources
- statistics: array of 5-7 relevant statistics with metrics
- timeline: key dates or events (if applicable)
- sources: 3-5 credible sources

Format as valid JSON only.`;

  const response = await client.messages.create({
    model: 'gpt-4o',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from OpenAI');
  }

  console.log('✅ Research complete');
  return content.text;
}

async function write(topic: string, category: string, subCategory: string, research: string): Promise<string> {
  console.log(`\n✍️ 2/5 Write: Crafting 2000-word article in ESPN voice...`);

  const prompt = `Write a professional 2000-word article about "${topic}" in the ${category} category (${subCategory}).

Style: ESPN sportscaster voice but adaptable to topic - conversational, authoritative, engaging.
Structure:
- Compelling intro hook (150 words)
- 3-4 main sections with headers (400-500 words each)
- At least one data table with 4-5 columns
- Relevant statistics bolded
- Real quotes or expert context
- Strong conclusion

Research context:
${research}

Return ONLY the article body text. No markdown headers - use plain text with line breaks.`;

  const response = await client.messages.create({
    model: 'gpt-4o',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from OpenAI');
  }

  console.log('✅ Article written');
  return content.text;
}

async function edit(articleBody: string): Promise<string> {
  console.log(`\n📝 3/5 Edit: Newsweek-level polish...`);

  const prompt = `Edit and improve this article text. Apply these standards:
- Active voice throughout
- Bold key statistics and surprising facts
- Tighten sentences to 15-20 words average
- Remove redundancy
- Enhance transitions between paragraphs
- Ensure professional tone without sacrificing personality

Return the edited article text only (no markdown, no headers).

Article:
${articleBody}`;

  const response = await client.messages.create({
    model: 'gpt-4o',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from OpenAI');
  }

  console.log('✅ Editing complete');
  return content.text;
}

async function layout(title: string, articleBody: string, category: string): Promise<string> {
  console.log(`\n🎨 4/5 Layout: Professional HTML with responsive styling...`);

  // Split article into paragraphs and sections
  const paragraphs = articleBody
    .split('\n\n')
    .filter((p) => p.trim().length > 0);

  let htmlContent = '';
  let sectionCount = 0;

  // Add intro
  if (paragraphs.length > 0) {
    htmlContent += `  <p class="intro"><em>${paragraphs[0]}</em></p>\n\n`;
  }

  // Process remaining paragraphs into sections
  for (let i = 1; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();

    // Detect section headers (short lines in caps or title case)
    const isLikelyHeader =
      para.length < 100 && (para === para.toUpperCase() || (para.split(' ').length <= 5 && /^[A-Z]/.test(para)));

    if (isLikelyHeader && sectionCount > 0) {
      htmlContent += `  </section>\n\n  <section>\n    <h2>${para}</h2>\n`;
    } else if (isLikelyHeader && sectionCount === 0) {
      htmlContent += `  <section>\n    <h2>${para}</h2>\n`;
      sectionCount++;
    } else {
      // Check if paragraph contains table-like data
      if (para.includes('|') || para.includes('\t')) {
        const lines = para.split('\n');
        if (lines.length > 2) {
          htmlContent += `    <table class="data-table">\n      <tbody>\n`;
          for (const line of lines) {
            const cells = line.split(/\s{2,}|\t/);
            if (cells.length > 1) {
              htmlContent += `        <tr>\n`;
              for (const cell of cells) {
                htmlContent += `          <td>${cell.trim()}</td>\n`;
              }
              htmlContent += `        </tr>\n`;
            }
          }
          htmlContent += `      </tbody>\n    </table>\n`;
        }
      } else {
        htmlContent += `    <p>${para}</p>\n`;
      }
    }
  }

  if (sectionCount > 0) {
    htmlContent += `  </section>\n`;
  }

  // Add unsplash image references
  const imageQuery = category.toLowerCase().replace(/\s+/g, '+');
  const unsplashImages = [
    `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80`, // generic
    `https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80`, // tech
    `https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80`, // sports
  ];

  const imageUrl = unsplashImages[Math.floor(Math.random() * unsplashImages.length)];

  const finalHtml = `<article class="pro-article">
  <h1>${title}</h1>

  <figure class="hero-image">
    <img src="${imageUrl}" alt="${title}" loading="lazy" />
  </figure>

${htmlContent}
</article>`;

  console.log('✅ Layout complete');
  return finalHtml;
}

async function publish(
  title: string,
  slug: string,
  category: string,
  subCategory: string,
  tldr: string,
  html: string,
): Promise<void> {
  console.log(`\n🚀 5/5 Publish: Auto-ingesting to site...`);

  const now = new Date();
  const dateStr = now.toISOString();
  const readingTime = Math.max(5, Math.ceil(html.split(' ').length / 200));

  const article: ArticleData = {
    id: `${slug}-${Date.now()}`,
    title,
    slug,
    category,
    subCategory,
    contentType: 'feature',
    tldr,
    date: dateStr,
    readingTime,
    imageUrl: `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80`,
    tags: [category.toLowerCase(), subCategory.toLowerCase()],
    contentPath: `/content/${category.toLowerCase()}/${slug}.html`,
    author: 'Nexairi Editorial',
    summary: tldr,
    excerpt: html.substring(0, 200).replace(/<[^>]*>/g, '').trim(),
    contentHtml: html,
  };

  // Write draft to drafts/ folder
  const draftPath = path.resolve(process.cwd(), `drafts/${slug}-draft.json`);
  await fs.mkdir(path.dirname(draftPath), { recursive: true });
  await fs.writeFile(draftPath, JSON.stringify(article, null, 2), 'utf8');

  console.log(`  📄 Draft saved to ${draftPath}`);

  // Run ingest
  try {
    execSync(`npx tsx scripts/ingest-article.ts ${draftPath}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (err) {
    console.error('❌ Ingest failed:', err);
    throw err;
  }

  // Git operations
  try {
    execSync('git add public/posts.json public/content/', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    execSync(`git commit -m "articles: add ${title}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    execSync('git push origin main', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log('✅ Published and pushed to GitHub');
  } catch (err) {
    console.warn('⚠️  Git operations encountered issues:', err);
  }
}

async function main() {
  const topic = process.argv[2];
  const category = process.argv[3] || 'Technology';

  if (!topic) {
    console.error('Usage: npm run newsroom "<topic>" [category]');
    console.error('Example: npm run newsroom "Bowl Season Guide" Sports');
    process.exit(1);
  }

  const subCategory = category === 'Sports' ? 'Analysis' : category === 'Technology' ? 'AI' : 'Feature';
  const slug = slugify(topic);

  try {
    console.log(`\n🏗️  NEXAIRI NEWSROOM: ${topic}`);
    console.log(`📁 Category: ${category} / ${subCategory}`);

    const researchData = await research(topic, category);
    const articleBody = await write(topic, category, subCategory, researchData);
    const editedBody = await edit(articleBody);
    const htmlArticle = await layout(topic, editedBody, category);
    await publish(topic, slug, category, subCategory, `${topic} - comprehensive analysis`, htmlArticle);

    console.log(`\n✨ Article complete and live! 🎉\n`);
  } catch (err: any) {
    console.error('\n❌ Newsroom failed:', err.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

export {};Fix: short paragraphs, active voice, 3-5 sentence sections, bold key stats, add pull quotes.`;

  const editor = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: editorPrompt }],
  });
  
  // 4. LAYOUT
  console.log('🎨 Layout Agent...');
  const layoutPrompt = `Convert to professional HTML with:
- <figure> Unsplash images (use placeholder URLs)
- <table> for stats/schedules
- <blockquote> pull quotes
- Tailwind classes for mobile

${editor.choices[0].message.content}`;

  const layout = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: layoutPrompt }],
  });
  
  // 5. PUBLISHER
  const json = {
    id
