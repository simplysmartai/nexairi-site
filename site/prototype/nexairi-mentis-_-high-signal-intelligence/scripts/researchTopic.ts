import 'dotenv/config';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import { perplexity } from '@ai-sdk/perplexity';
import { CORE_PILLARS, type PillarSlug } from './lib/pillars';

const REPORT_DIR = path.resolve(process.cwd(), 'reports', 'research');

interface TopicSuggestion {
  title: string;
  angle: string;
  hook: string;
  confidence: number;
  sources: string[];
}

interface PillarReport {
  slug: PillarSlug;
  title: string;
  description: string;
  ideas: TopicSuggestion[];
}

const createPerplexityClient = perplexity as unknown as (config: { apiKey: string }) => any;

const perplexityClient = process.env.PERPLEXITY_API_KEY
  ? createPerplexityClient({ apiKey: process.env.PERPLEXITY_API_KEY })
  : null;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function parseArgs(): { pillar?: PillarSlug; outputJson: boolean } {
  const args = process.argv.slice(2).map((arg) => arg.trim().toLowerCase());
  let pillar: PillarSlug | undefined;
  let outputJson = false;
  args.forEach((arg) => {
    if (arg === '--json') {
      outputJson = true;
      return;
    }
    const match = CORE_PILLARS.find((item) => item.slug === arg);
    if (match) {
      pillar = match.slug;
    }
  });
  return { pillar, outputJson };
}

function coerceArray(value: unknown): TopicSuggestion[] {
  if (!value || typeof value !== 'object') return [];
  if (!Array.isArray((value as any).topics)) return [];
  return ((value as any).topics as TopicSuggestion[])
    .map((topic) => ({
      title: topic.title?.trim() || 'Untitled Idea',
      angle: topic.angle?.trim() || 'Perspective TBD',
      hook: topic.hook?.trim() || 'Clarify this angle with research.',
      confidence: Math.max(0.1, Math.min(0.99, Number(topic.confidence) || 0.5)),
      sources: Array.isArray(topic.sources)
        ? topic.sources.filter((source) => typeof source === 'string' && source.trim().length > 0)
        : [],
    }))
    .slice(0, 5);
}

async function fetchWithPerplexity(prompt: string): Promise<TopicSuggestion[]> {
  if (!perplexityClient || typeof perplexityClient.generateText !== 'function') {
    return [];
  }
  const { text } = await perplexityClient.generateText({
    model: 'llama-3.1-sonar-large-128k-online',
    prompt,
    temperature: 0.3,
    maxTokens: 1200,
  });
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return coerceArray(parsed);
  } catch (error) {
    console.warn('⚠️  Perplexity payload was not JSON, attempting heuristic parse.');
    const fallback = text
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 5)
      .map((line) => ({
        title: line.replace(/^[-*\d\.\s]+/, '').trim(),
        angle: 'Manual follow-up required.',
        hook: 'Research summary only.',
        confidence: 0.4,
        sources: [],
      }));
    return fallback;
  }
}

async function fetchWithOpenAI(prompt: string): Promise<TopicSuggestion[]> {
  if (!openai) {
    return [];
  }
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content:
          'You are Nexairi Research. Return JSON with key "topics" as an array of {title, angle, hook, confidence, sources}.',
      },
      { role: 'user', content: prompt },
    ],
  });
  const payload = completion.choices[0].message?.content;
  if (!payload) return [];
  try {
    const parsed = JSON.parse(payload);
    return coerceArray(parsed);
  } catch (error) {
    console.warn('⚠️  OpenAI payload parse failed.', error);
    return [];
  }
}

async function collectTopics(pillar: (typeof CORE_PILLARS)[number]): Promise<PillarReport> {
  const prompt = `Pillar: ${pillar.title} (${pillar.slug})\nFocus: ${pillar.description}\nReturn JSON with key "topics" = array of five entries. Each entry needs:\n- title (<=12 words)\n- angle (1 sentence)\n- hook (why now)\n- confidence (0-1 float)\n- sources (array of URLs or publications).`;
  let ideas = await fetchWithPerplexity(prompt);
  if (ideas.length === 0) {
    ideas = await fetchWithOpenAI(prompt);
  }
  if (ideas.length === 0) {
    ideas = Array.from({ length: 5 }).map((_, index) => ({
      title: `${pillar.title} signal ${index + 1}`,
      angle: 'Manual research required (Perplexity API unavailable).',
      hook: 'Pull data manually and update.',
      confidence: 0.35,
      sources: [],
    }));
  }
  return {
    slug: pillar.slug,
    title: pillar.title,
    description: pillar.description,
    ideas,
  };
}

async function persistReport(report: PillarReport[]): Promise<string> {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:]/g, '-');
  const outPath = path.join(REPORT_DIR, `topics-${timestamp}.json`);
  const payload = {
    generatedAt: new Date().toISOString(),
    pillars: report,
  };
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');
  return outPath;
}

function printReport(reports: PillarReport[], outputJson: boolean): void {
  if (outputJson) {
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), pillars: reports }, null, 2));
    return;
  }
  reports.forEach((pillar) => {
    console.log(`\n🎯 ${pillar.title} (${pillar.slug})`);
    pillar.ideas.forEach((idea, idx) => {
      console.log(`  ${idx + 1}. ${idea.title}`);
      console.log(`     Angle: ${idea.angle}`);
      console.log(`     Hook: ${idea.hook}`);
      console.log(`     Confidence: ${(idea.confidence * 100).toFixed(0)}%`);
      if (idea.sources.length) {
        console.log(`     Sources: ${idea.sources.join('; ')}`);
      }
    });
  });
}

async function main() {
  const { pillar, outputJson } = parseArgs();
  const targets = pillar ? CORE_PILLARS.filter((item) => item.slug === pillar) : [...CORE_PILLARS];
  if (targets.length === 0) {
    console.error('No valid pillar requested. Available options:', CORE_PILLARS.map((p) => p.slug).join(', '));
    process.exit(1);
  }
  console.log(`🧪 Research agent running for pillar(s): ${targets.map((p) => p.slug).join(', ')}`);
  const reports: PillarReport[] = [];
  for (const target of targets) {
    const result = await collectTopics(target);
    reports.push(result);
  }
  const outPath = await persistReport(reports);
  printReport(reports, outputJson);
  console.log(`\n🗂️  Saved research packet → ${path.relative(process.cwd(), outPath)}`);
  console.log('Next command: npm run research <pillar-slug> or npm run orchestra:week');
}

main().catch((error) => {
  console.error('researchTopic agent failed:', error);
  process.exit(1);
});
