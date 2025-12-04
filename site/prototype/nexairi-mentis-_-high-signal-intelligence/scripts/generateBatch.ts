import 'dotenv/config';

import { GENRE_KEYS, GenreKey, runGeneratePost } from './generatePost';

interface BatchArgs {
  genres: GenreKey[];
  perGenre: number;
  topics: string[];
  quiet: boolean;
}

const DEFAULT_GENRES: GenreKey[] = ['technology', 'lifestyle', 'travel'];

function parseGenres(raw?: string): GenreKey[] {
  if (!raw) return DEFAULT_GENRES;
  const candidates = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const deduped = Array.from(new Set(candidates));
  const valid = deduped.filter((value): value is GenreKey => GENRE_KEYS.includes(value as GenreKey));
  return valid.length ? valid : DEFAULT_GENRES;
}

function parseTopics(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseArgs(): BatchArgs {
  const args = process.argv.slice(2);
  let genres: GenreKey[] | undefined;
  let perGenre = 1;
  let topics: string[] = [];
  let quiet = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if ((arg === '--genres' || arg === '-g') && args[i + 1]) {
      genres = parseGenres(args[i + 1]);
      i += 1;
    } else if ((arg === '--per-genre' || arg === '-n') && args[i + 1]) {
      const parsed = Number.parseInt(args[i + 1], 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        perGenre = parsed;
      }
      i += 1;
    } else if (arg === '--topics' && args[i + 1]) {
      topics = parseTopics(args[i + 1]);
      i += 1;
    } else if (arg === '--quiet') {
      quiet = true;
    }
  }

  return {
    genres: genres ?? DEFAULT_GENRES,
    perGenre,
    topics,
    quiet,
  };
}

async function main() {
  const { genres, perGenre, topics, quiet } = parseArgs();
  const summary: Array<{ genre: GenreKey; topic: string; slug: string }> = [];

  for (const genre of genres) {
    for (let i = 0; i < perGenre; i += 1) {
      const topic = topics.shift();
      console.log(`🚀 Generating ${genre} post (${i + 1}/${perGenre})${topic ? ` → ${topic}` : ''}`);
      try {
        const result = await runGeneratePost({ genre, topic, quiet });
        summary.push({ genre, topic: result.topic, slug: result.slug });
      } catch (error) {
        console.error(`❌ Failed to generate ${genre} post:`, error);
      }
    }
  }

  if (!summary.length) {
    console.log('No posts generated. Check errors above.');
    return;
  }

  console.log('\nBatch summary');
  summary.forEach((item) => {
    console.log(` • [${item.genre}] ${item.topic} → ${item.slug}`);
  });
  if (!quiet) {
    console.log('\nNext steps: npm run validate-posts && git status');
  }
}

main().catch((error) => {
  console.error('generateBatch failed:', error);
  process.exit(1);
});
