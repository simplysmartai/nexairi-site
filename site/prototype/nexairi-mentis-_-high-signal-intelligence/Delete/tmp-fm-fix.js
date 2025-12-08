import { promises as fs } from 'node:fs';
import path from 'node:path';

const overrides = {
  'top-15-games-holiday-2025': {
    title: 'Cross-Platform Greatness: The 15 Games Defining Holiday 2025',
    slug: 'top-15-games-holiday-2025',
    date: '2025-12-04T03:19:47.997Z',
    category: 'Technology',
    author: 'Sami W.',
    summary: '15 cross-platform releases worth gifting (or playing) for Holiday 2025.',
    excerpt: 'Cross-platform hits for PS5, Xbox Series X, and Switch in 2025.',
    tags: [],
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1600',
    isFeatured: false,
    affiliateDisclosure: true,
  },
  'college-football-championship-guide-2025': {
    title: 'College Football Championship Guide 2025',
    slug: 'college-football-championship-guide-2025',
    date: '2025-12-04T03:19:47.951Z',
    category: 'Sports',
    author: 'James S.',
    summary: 'Your guide to the 2025 college football conference championships and playoff stakes.',
    excerpt: 'Conference title weekend viewing plan plus playoff implications.',
    tags: [],
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1600',
    isFeatured: false,
  },
  'nontraditional-holiday-getaways': {
    title: 'Nontraditional Holiday Getaways',
    slug: 'nontraditional-holiday-getaways',
    date: '2025-12-04T03:19:47.974Z',
    category: 'Travel',
    author: 'Barry L.',
    summary: 'Holiday escapes that trade obligation for quiet itineraries and intentional rest.',
    excerpt: 'Low-key city breaks, desert resets, and practical wellness retreats for the holidays.',
    tags: [],
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1600',
    isFeatured: false,
  },
};

function serialize(meta) {
  const escape = (value) => String(value).replace(/"/g, '\\"');
  const lines = ['---'];
  for (const [key, value] of Object.entries(meta)) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        value.forEach((item) => lines.push(`  - "${escape(item)}"`));
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: "${escape(value)}"`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

function stripFrontmatter(raw) {
  let text = raw.replace(/^\uFEFF/, '');
  while (text.startsWith('---')) {
    const endIndex = text.indexOf('\n---', 3);
    if (endIndex === -1) break;
    text = text.slice(endIndex + 4).replace(/^\s*/, '');
    if (!text.startsWith('---')) break;
  }
  return text.trimStart();
}

async function main() {
  for (const [slug, meta] of Object.entries(overrides)) {
    const filePath = path.resolve('public', 'content', `${slug}.html`);
    const raw = await fs.readFile(filePath, 'utf8');
    const body = stripFrontmatter(raw);
    const next = `${serialize(meta)}${body}`;
    await fs.writeFile(filePath, `${next.trimEnd()}\n`, 'utf8');
    console.log(`Rebuilt frontmatter for ${slug}`);
  }
}

main().catch((error) => {
  console.error('tmp-fm-fix failed:', error);
  process.exit(1);
});
