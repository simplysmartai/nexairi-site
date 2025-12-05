import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CORE_PILLARS, type Pillar } from './lib/pillars';

interface TopicIdea {
  title: string;
  angle?: string;
  hook?: string;
}

interface DayPlan {
  date: string;
  weekday: string;
  stage: string;
  pillar: Pillar;
  topic?: TopicIdea;
  tasks: string[];
}

const REPORT_DIR = path.resolve(process.cwd(), 'reports', 'schedule');
const STAGES = ['Research', 'Outline', 'Draft', 'Review', 'Publish', 'Distribution', 'Analytics'];

function parseArgs(): { planOnly: boolean; json: boolean } {
  const args = process.argv.slice(2);
  return {
    planOnly: args.includes('--plan'),
    json: args.includes('--json'),
  };
}

async function loadLatestResearch(): Promise<Record<string, TopicIdea[]>> {
  const researchDir = path.resolve(process.cwd(), 'reports', 'research');
  try {
    const files = await fs.readdir(researchDir);
    const jsonFiles = files.filter((file) => file.endsWith('.json')).sort().reverse();
    if (jsonFiles.length === 0) return {};
    const payload = await fs.readFile(path.join(researchDir, jsonFiles[0]), 'utf8');
    const data = JSON.parse(payload) as { pillars?: Array<{ slug: string; ideas?: TopicIdea[] }> };
    const result: Record<string, TopicIdea[]> = {};
    data.pillars?.forEach((pillar) => {
      if (pillar.slug && pillar.ideas?.length) {
        result[pillar.slug] = pillar.ideas;
      }
    });
    return result;
  } catch (error) {
    console.warn('⚠️  No research packets found yet. Run `npm run research-all` first.');
    return {};
  }
}

function startOfNextMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = (8 - day) % 7 || 7; // days until next Monday
  const anchor = new Date(now);
  anchor.setDate(now.getDate() + diff);
  anchor.setHours(0, 0, 0, 0);
  return anchor;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function weekdayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function planTasks(stage: string): string[] {
  switch (stage) {
    case 'Research':
      return ['Pull Perplexity scan', 'Clip references into Notion', 'Share signal summary'];
    case 'Outline':
      return ['Lock thesis + CTA', 'Assign H2/H3 ladder', 'Prep interview questions'];
    case 'Draft':
      return ['Run generate-post', 'Inline copy review', 'Insert affiliate hooks'];
    case 'Review':
      return ['Human approval', 'Legal sweep', 'Image QA'];
    case 'Publish':
      return ['npm run seo-optimize', 'npm run publish-agent -- --auto', 'Announce on socials'];
    case 'Distribution':
      return ['Clip newsletter blurb', 'Prep LinkedIn carousel', 'Record Loom recap'];
    case 'Analytics':
    default:
      return ['Pull analytics-agent', 'Update topic weights', 'Feed back to research'];
  }
}

async function buildSchedule(): Promise<DayPlan[]> {
  const research = await loadLatestResearch();
  const start = startOfNextMonday();
  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const pillar = CORE_PILLARS[i % CORE_PILLARS.length];
    const ideas = research[pillar.slug] ?? [];
    const topic = ideas.length ? ideas[i % ideas.length] : undefined;
    const stage = STAGES[i] ?? STAGES[STAGES.length - 1];
    days.push({
      date: formatDate(date),
      weekday: weekdayName(date),
      stage,
      pillar,
      topic,
      tasks: planTasks(stage),
    });
  }
  return days;
}

async function main() {
  const { planOnly, json } = parseArgs();
  const schedule = await buildSchedule();
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const outPath = path.join(REPORT_DIR, `week-${schedule[0].date}.json`);
  await fs.writeFile(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), schedule }, null, 2),
    'utf8',
  );
  if (json) {
    console.log(JSON.stringify(schedule, null, 2));
  } else {
    console.log('🗓️  Weekly Agent Schedule');
    schedule.forEach((day) => {
      console.log(`- ${day.weekday} (${day.date}) – ${day.stage} · ${day.pillar.title}`);
      if (day.topic) {
        console.log(`    Topic: ${day.topic.title}`);
      }
      if (!planOnly) {
        console.log(`    Tasks: ${day.tasks.join(' | ')}`);
      }
    });
    console.log(`Saved schedule → ${path.relative(process.cwd(), outPath)}`);
  }
  console.log('Next command: npm run review-queue');
}

main().catch((error) => {
  console.error('weeklySchedule agent failed:', error);
  process.exit(1);
});
