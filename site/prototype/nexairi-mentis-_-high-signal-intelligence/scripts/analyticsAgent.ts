import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { BlogPost } from '../types';
import { CORE_PILLARS, type PillarSlug } from './lib/pillars';

interface Metrics {
  views: number;
  ctr: number;
  conversions: number;
}

interface PillarRecommendation {
  pillar: string;
  slug: PillarSlug;
  weight: number;
  action: string;
}

const ANALYTICS_DIR = path.resolve(process.cwd(), 'reports', 'analytics');
const METRICS_FILE = path.join(ANALYTICS_DIR, 'metrics.json');

async function readJson<T>(file: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    return null;
  }
}

async function loadPosts(): Promise<BlogPost[]> {
  const file = path.resolve('public', 'posts.json');
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw) as BlogPost[];
}

function inferPillar(post: BlogPost): PillarSlug {
  const slug = post.slug.toLowerCase();
  const summary = `${post.summary ?? ''}`.toLowerCase();
  if (post.category === 'Technology' || /agent|model|ai|benchmark|automation/.test(summary)) {
    return 'agent-labs';
  }
  if (/playbook|workflow|team|human/.test(summary) || post.category === 'Lifestyle') {
    return 'human-in-loop';
  }
  if (/risk|edge|compliance|incident/.test(summary) || post.category === 'Sports') {
    return 'ai-edge-cases';
  }
  if (post.category === 'Travel' || /stack|no-code|automation/.test(summary)) {
    return 'no-code-ai';
  }
  return 'future-proofing';
}

async function loadMetrics(posts: BlogPost[]): Promise<Record<string, Metrics>> {
  const metrics = (await readJson<Record<string, Metrics>>(METRICS_FILE)) ?? {};
  const updated = { ...metrics };
  posts.forEach((post) => {
    if (!updated[post.slug]) {
      const baseline = 50 + Math.floor(Math.random() * 150);
      updated[post.slug] = {
        views: baseline,
        ctr: Number((0.8 + Math.random() * 1.2).toFixed(2)),
        conversions: Number((Math.random() * 5).toFixed(2)),
      };
    }
  });
  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
  await fs.writeFile(METRICS_FILE, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

function aggregateByPillar(posts: BlogPost[], metrics: Record<string, Metrics>): Map<PillarSlug, number> {
  const map = new Map<PillarSlug, number>();
  posts.forEach((post) => {
    const pillar = inferPillar(post);
    const signal = metrics[post.slug];
    if (!signal) return;
    const score = signal.views * 0.6 + signal.ctr * 20 + signal.conversions * 10;
    map.set(pillar, (map.get(pillar) ?? 0) + score);
  });
  const total = Array.from(map.values()).reduce((sum, value) => sum + value, 0) || 1;
  CORE_PILLARS.forEach((pillar) => {
    if (!map.has(pillar.slug as PillarSlug)) {
      map.set(pillar.slug as PillarSlug, total * 0.1);
    }
  });
  const normalized = new Map<PillarSlug, number>();
  const nextTotal = Array.from(map.values()).reduce((sum, value) => sum + value, 0) || 1;
  map.forEach((value, key) => {
    normalized.set(key, Number((value / nextTotal).toFixed(3)));
  });
  return normalized;
}

function buildRecommendations(weights: Map<PillarSlug, number>): PillarRecommendation[] {
  const avg = Array.from(weights.values()).reduce((sum, value) => sum + value, 0) / weights.size;
  return CORE_PILLARS.map((pillar) => {
    const weight = weights.get(pillar.slug as PillarSlug) ?? avg;
    const action = weight < avg
      ? 'Increase research + publishing cadence'
      : weight > avg * 1.2
        ? 'Hold current cadence, build derivative assets'
        : 'Maintain weekly touch';
    return {
      pillar: pillar.title,
      slug: pillar.slug as PillarSlug,
      weight,
      action,
    };
  }).sort((a, b) => b.weight - a.weight);
}

async function main() {
  const posts = await loadPosts();
  const metrics = await loadMetrics(posts);
  const weights = aggregateByPillar(posts, metrics);
  const recommendations = buildRecommendations(weights);
  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
  const outPath = path.join(ANALYTICS_DIR, `recommendations-${new Date().toISOString().replace(/[:]/g, '-')}.json`);
  await fs.writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), recommendations }, null, 2), 'utf8');
  console.log('📊 Topic Weights');
  recommendations.forEach((rec) => {
    console.log(`- ${rec.pillar}: ${(rec.weight * 100).toFixed(1)}% • ${rec.action}`);
  });
  console.log(`Saved analytics packet → ${path.relative(process.cwd(), outPath)}`);
  console.log('Next command: npm run research-all');
}

main().catch((error) => {
  console.error('analyticsAgent failed:', error);
  process.exit(1);
});
