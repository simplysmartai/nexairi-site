import 'dotenv/config';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';

interface RawTicketInput {
  source?: string;
  subject?: string;
  message?: string;
  summary?: string;
  email?: string;
  name?: string;
  company?: string;
  priorityHint?: string;
  channelId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface NormalizedTicketInput {
  source: TicketSource;
  subject: string;
  message: string;
  contact: {
    name?: string;
    email?: string;
    company?: string;
  };
  summary: string;
  priorityHint?: string;
  channelId?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

type TicketSource = 'email' | 'form' | 'system';

type TicketTier = 'tier0' | 'tier1' | 'tier2' | 'tier3';

interface RoutedTicket {
  id: string;
  receivedAt: string;
  source: TicketSource;
  status: 'new';
  subject: string;
  message: string;
  summary: string;
  tier: TicketTier;
  priorityScore: number;
  tags: string[];
  contact: NormalizedTicketInput['contact'];
  audit: {
    heuristics: HeuristicResult;
    llm?: LlmClassification;
    routerVersion: string;
  };
  metadata: Record<string, unknown>;
}

interface HeuristicResult {
  tier: TicketTier;
  reasons: string[];
  tags: string[];
  priorityScore: number;
}

interface LlmClassification {
  tier?: TicketTier;
  intent?: string;
  sentiment?: 'negative' | 'neutral' | 'positive';
  tags?: string[];
  confidence?: number;
}

const SUPPORT_INBOX_DIR = path.resolve(process.cwd(), 'reports', 'support', 'inbox');
const ROUTER_VERSION = '2025.12.05';
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface CliArgs {
  inputPath?: string;
  sourceOverride?: TicketSource;
  dryRun: boolean;
  json: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let inputPath: string | undefined;
  let sourceOverride: TicketSource | undefined;
  let dryRun = false;
  let json = false;
  for (const arg of args) {
    if (arg.startsWith('--input=')) {
      inputPath = arg.split('=')[1];
      continue;
    }
    if (arg.startsWith('--source=')) {
      const candidate = arg.split('=')[1];
      if (candidate === 'email' || candidate === 'form' || candidate === 'system') {
        sourceOverride = candidate;
      }
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--json') {
      json = true;
    }
  }
  return { inputPath, sourceOverride, dryRun, json };
}

async function readPayloadFromStdin(): Promise<string | null> {
  if (process.stdin.isTTY) {
    return null;
  }
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data.trim() ? data : null);
    });
    process.stdin.on('error', () => resolve(null));
  });
}

async function loadRawPayload(args: CliArgs): Promise<RawTicketInput> {
  if (args.inputPath) {
    const file = await fs.readFile(path.resolve(process.cwd(), args.inputPath), 'utf8');
    return JSON.parse(file) as RawTicketInput;
  }
  const stdinData = await readPayloadFromStdin();
  if (stdinData) {
    return JSON.parse(stdinData) as RawTicketInput;
  }
  return {
    source: 'email',
    subject: 'Sample: Performance spike on /agent-labs',
    message:
      'Seeing a 500 error burst hitting the Agent Labs page around 14:02 UTC. Please confirm if deploy v128 introduced a regression.',
    email: 'alerts@nexairi-monitoring.com',
    name: 'SignalWatch Bot',
    priorityHint: 'tier1',
    tags: ['ops', 'agent-labs'],
    metadata: { deployment: 'v128', region: 'iad' },
  };
}

function coerceSource(value?: string, override?: TicketSource): TicketSource {
  if (override) return override;
  if (value === 'email' || value === 'form' || value === 'system') {
    return value;
  }
  return 'email';
}

function normalizePayload(raw: RawTicketInput, args: CliArgs): NormalizedTicketInput {
  const subject = (raw.subject?.trim() || raw.summary?.trim() || 'Untitled support request').slice(0, 140);
  const message = (raw.message?.trim() || raw.summary?.trim() || 'No body provided.').trim();
  const summary = raw.summary?.trim() || message.slice(0, 240);
  return {
    source: coerceSource(raw.source, args.sourceOverride),
    subject,
    message,
    summary,
    priorityHint: raw.priorityHint,
    channelId: raw.channelId,
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [],
    metadata: raw.metadata ?? {},
    contact: {
      email: raw.email?.toLowerCase().trim(),
      name: raw.name?.trim(),
      company: raw.company?.trim(),
    },
  };
}

function keywordMatch(patterns: RegExp[], text: string): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function scoreHeuristics(ticket: NormalizedTicketInput): HeuristicResult {
  const text = `${ticket.subject}\n${ticket.message}`.toLowerCase();
  const reasons: string[] = [];
  const tags = new Set<string>(ticket.tags);
  let tier: TicketTier = 'tier2';

  if (ticket.priorityHint === 'tier0') {
    tier = 'tier0';
    reasons.push('Priority hint tier0');
  } else if (ticket.priorityHint === 'tier1') {
    tier = 'tier1';
    reasons.push('Priority hint tier1');
  }

  if (keywordMatch([/outage/, /down/, /breach/, /leak/, /security/, /p1/], text)) {
    tier = 'tier0';
    reasons.push('Critical keyword detected');
    tags.add('incident');
  } else if (keywordMatch([/sponsor/, /partner/, /billing/, /contract/, /deadline/, /sla/], text)) {
    if (tier !== 'tier0') tier = 'tier1';
    reasons.push('Business-critical keyword');
    tags.add('partner');
  } else if (keywordMatch([/feedback/, /idea/, /suggest/, /nice to have/, /future/, /wishlist/], text)) {
    if (tier !== 'tier0' && tier !== 'tier1') tier = 'tier3';
    reasons.push('Advisory keyword');
    tags.add('advisory');
  }

  const priorityScore = tier === 'tier0' ? 100 : tier === 'tier1' ? 70 : tier === 'tier2' ? 40 : 10;

  return {
    tier,
    reasons: reasons.length ? reasons : ['Default classification'],
    tags: Array.from(tags),
    priorityScore,
  };
}

async function classifyWithOpenAI(ticket: NormalizedTicketInput): Promise<LlmClassification | undefined> {
  if (!openai) return undefined;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are Nexairi support router. Respond in JSON with keys tier (tier0/tier1/tier2/tier3), intent, sentiment, tags (array), confidence (0-1).',
        },
        {
          role: 'user',
          content: JSON.stringify({
            subject: ticket.subject,
            message: ticket.message,
            source: ticket.source,
            priorityHint: ticket.priorityHint,
          }),
        },
      ],
    });
    const payload = completion.choices[0].message?.content;
    if (!payload) return undefined;
    const parsed = JSON.parse(payload) as LlmClassification;
    if (parsed.tags && !Array.isArray(parsed.tags)) {
      parsed.tags = [String(parsed.tags)].filter(Boolean) as string[];
    }
    return parsed;
  } catch (error) {
    console.warn('⚠️  OpenAI classification failed, using heuristics only.', error);
    return undefined;
  }
}

function mergeClassification(heuristics: HeuristicResult, llm?: LlmClassification): { tier: TicketTier; tags: string[]; priorityScore: number } {
  if (!llm) {
    return { tier: heuristics.tier, tags: heuristics.tags, priorityScore: heuristics.priorityScore };
  }
  const tags = new Set<string>(heuristics.tags);
  llm.tags?.forEach((tag) => tags.add(tag));
  const tier = llm.tier ?? heuristics.tier;
  const priorityScore = Math.max(heuristics.priorityScore, tier === 'tier0' ? 100 : tier === 'tier1' ? 75 : tier === 'tier2' ? 45 : 15);
  return { tier, tags: Array.from(tags), priorityScore };
}

function buildTicket(
  normalized: NormalizedTicketInput,
  classification: { tier: TicketTier; tags: string[]; priorityScore: number },
  heuristics: HeuristicResult,
  llm?: LlmClassification,
): RoutedTicket {
  return {
    id: `st_${new Date().toISOString().replace(/[:]/g, '-')}_${randomUUID().slice(0, 8)}`,
    receivedAt: new Date().toISOString(),
    source: normalized.source,
    status: 'new',
    subject: normalized.subject,
    message: normalized.message,
    summary: normalized.summary,
    tier: classification.tier,
    priorityScore: classification.priorityScore,
    tags: classification.tags,
    contact: normalized.contact,
    metadata: {
      ...normalized.metadata,
      channelId: normalized.channelId,
      sourceTags: normalized.tags,
    },
    audit: {
      heuristics,
      llm,
      routerVersion: ROUTER_VERSION,
    },
  };
}

async function persistTicket(ticket: RoutedTicket): Promise<string> {
  await fs.mkdir(SUPPORT_INBOX_DIR, { recursive: true });
  const file = path.join(SUPPORT_INBOX_DIR, `${ticket.id}.json`);
  await fs.writeFile(file, JSON.stringify(ticket, null, 2), 'utf8');
  return file;
}

async function main() {
  const args = parseArgs();
  const raw = await loadRawPayload(args);
  const normalized = normalizePayload(raw, args);
  const heuristics = scoreHeuristics(normalized);
  const llm = await classifyWithOpenAI(normalized);
  const classification = mergeClassification(heuristics, llm);
  const ticket = buildTicket(normalized, classification, heuristics, llm);

  if (args.json) {
    console.log(JSON.stringify(ticket, null, 2));
  } else {
    console.log(`📨 Routed ticket ${ticket.id}`);
    console.log(`   • Tier: ${ticket.tier}`);
    console.log(`   • Subject: ${ticket.subject}`);
    console.log(`   • Tags: ${ticket.tags.join(', ') || 'none'}`);
    if (ticket.tier === 'tier0' || ticket.tier === 'tier1') {
      console.log('   ⚠️  High-priority ticket. Notify on-call immediately.');
    }
  }

  if (!args.dryRun) {
    const savedPath = await persistTicket(ticket);
    if (!args.json) {
      console.log(`Saved → ${path.relative(process.cwd(), savedPath)}`);
      console.log('Next command: npm run email-agent');
    }
  } else if (!args.json) {
    console.log('Dry run enabled. Ticket not saved.');
  }
}

main().catch((error) => {
  console.error('supportRouter agent failed:', error);
  process.exit(1);
});
