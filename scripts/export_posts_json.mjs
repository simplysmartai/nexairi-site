#!/usr/bin/env node
// Convert site/posts/*.html (head + <article> body) into JSON files under content_html/<slug>.json
// Usage:
//   node scripts/export_posts_json.mjs \
//     site/posts/30-day-holiday-reset.html \
//     site/posts/hosting-without-burning-out.html \
//     site/posts/carry-on-winter-one-bag.html \
//     site/posts/arrival-architecture-city-onboarding.html \
//     site/posts/traveling-through-italy-field-guide.html \
//     site/posts/traveling-through-korea-field-guide.html

import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Provide one or more HTML files from site/posts/.');
  process.exit(1);
}

const outDir = path.join('content_html');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const get = (re, s) => {
  const m = s.match(re); return m ? m[1].trim() : '';
};

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const title = get(/<title>([^<]*)<\/title>/i, html);
  const description = get(/<meta\s+name="description"\s+content="([^"]*)"/i, html);
  const keywords = get(/<meta\s+name="keywords"\s+content="([^"]*)"/i, html)
    .split(',').map(k=>k.trim()).filter(Boolean);
  const category = get(/<meta\s+name="category"\s+content="([^"]*)"/i, html) || get(/<meta\s+property="article:section"\s+content="([^"]*)"/i, html);
  const canonical = get(/<link\s+rel="canonical"\s+href="([^"]*)"/i, html);
  const og_image = get(/<meta\s+property="og:image"\s+content="([^"]*)"/i, html);
  const bodyMatch = html.match(/<article[\s\S]*?>[\s\S]*<\/article>/i);
  const body_html = bodyMatch ? bodyMatch[0] : '';
  const figcap = get(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i, html);
  const image_prompt = (figcap.match(/Image prompt:\s*([\s\S]*)/i)||[])[1]?.trim() || '';

  const slug = path.basename(f).replace(/\.html$/,'');
  const out = {
    title,
    slug,
    category: category || 'travel',
    description,
    keywords,
    canonical,
    og_image,
    image_prompt,
    html: body_html
  };
  const outPath = path.join(outDir, slug + '.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote', outPath);
}

