import 'dotenv/config';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';

interface SupportTicket {
  id: string;
  receivedAt: string;
  source: 'email' | 'form' | 'system';
  status: string;
  subject: string;
  message: string;
  summary: string;
  tier: 'tier0' | 'tier1' | 'tier2' | 'tier3';
  priorityScore: number;
  tags: string[];
  contact: {
    name?: string;
    email?: string;
    company?: string;
  };
  metadata?: Record<string, unknown> & {
    channelId?: string;
    sourceTags?: string[];
  };
  audit?: Record<string, unknown>;
  history?: Array<{
    at: string;
    type: 'inbound' | 'outbound' | 'system';
    summary: string;
    payload?: Record<string, unknown>;
  }>;
  acknowledgedAt?: string;
  lastEmail?: {
    at: string;
    subject: string;
    to: string[];
    cc?: string[];
    model?: string;
  };
}

interface EmailPayload {
  subject: string;
  body: string;
  escalationNote?: string;
}

interface CliArgs {
  id?: string;
  all: boolean;
  dryRun: boolean;
  json: boolean;
  limit?: number;
}

const SUPPORT_INBOX_DIR = path.resolve(process.cwd(), 'reports', 'support', 'inbox');
const SUPPORT_OUTBOX_DIR = path.resolve(process.cwd(), 'reports', 'support', 'outbox');
const SUPPORT_ESCALATION_DIR = path.resolve(process.cwd(), 'reports', 'support', 'escalations');
const SUPPORT_FROM_ADDRESS = process.env.SUPPORT_FROM_ADDRESS || 'support@nexairi.com';
const SUPPORT_ESCALATION_EMAILS = (process.env.SUPPORT_ESCALATION_EMAILS || 'jimmy@nexairi.com')
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean);
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let id: string | undefined;
  let all = false;
  let dryRun = false;
  let json = false;
  let limit: number | undefined;
  for (const arg of args) {
    if (arg === '--all') {
      all = true;
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg.startsWith('--id=')) {
      id = arg.split('=')[1];
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const value = Number(arg.split('=')[1]);
      if (!Number.isNaN(value)) {
        limit = value;
      }
      continue;
    }
  }
  return { id, all, dryRun, json, limit };
}

async function listTicketFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(SUPPORT_INBOX_DIR);
    return files.filter((file) => file.endsWith('.json')).sort();
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function loadTicket(filePath: string): Promise<SupportTicket> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as SupportTicket;
}

function filterTickets(tickets: Array<{ ticket: SupportTicket; path: string }>, args: CliArgs) {
  let selected = tickets;
  if (args.id) {
    selected = tickets.filter(({ ticket }) => ticket.id === args.id);
  }
  if (!args.all && !args.id) {
    selected = selected.filter(({ ticket }) => ticket.status === 'new');
  }
  if (typeof args.limit === 'number') {
    selected = selected.slice(0, args.limit);
  }
  return selected;
}

function humanSalutation(ticket: SupportTicket): string {
  const name = ticket.contact?.name?.trim();
  if (name) return `Hi ${name.split(' ')[0]},`;
  return 'Hi there,';
}

async function draftEmail(ticket: SupportTicket): Promise<EmailPayload> {
  if (!openai) {
    return {
      subject: `We received your note: ${ticket.subject}`.slice(0, 90),
      body: `${humanSalutation(ticket)}

Thanks for flagging "${ticket.subject}". Our team has routed this as ${ticket.tier.toUpperCase()} priority and is reviewing the logs now.

We will follow up with a detailed update within the next business cycle. If you have screenshots, timestamps, or additional context, just reply to this email so we can accelerate the fix.

— Nexairi Support`,
    };
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are Nexairi support email agent. Respond in JSON with keys subject and body (plain text <= 220 words). Tone: precise, calm, high-signal.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            ticket: {
              subject: ticket.subject,
              tier: ticket.tier,
              summary: ticket.summary,
              tags: ticket.tags,
              receivedAt: ticket.receivedAt,
            },
          }),
        },
      ],
    });
    const payload = completion.choices[0].message?.content;
    if (!payload) throw new Error('Empty completion');
    const parsed = JSON.parse(payload) as EmailPayload;
    if (!parsed.subject || !parsed.body) throw new Error('Missing keys');
    return parsed;
  } catch (error) {
    console.warn('⚠️  OpenAI email draft failed, using fallback.', error);
    return {
      subject: `We received your note: ${ticket.subject}`.slice(0, 90),
      body: `${humanSalutation(ticket)}

Your request is in our queue at ${ticket.tier.toUpperCase()} priority. Expect an update soon.

— Nexairi Support`,
    };
  }
}

async function ensureDirs() {
  await Promise.all([
    fs.mkdir(SUPPORT_INBOX_DIR, { recursive: true }),
    fs.mkdir(SUPPORT_OUTBOX_DIR, { recursive: true }),
    fs.mkdir(SUPPORT_ESCALATION_DIR, { recursive: true }),
  ]);
}

function shouldEscalate(ticket: SupportTicket): boolean {
  return ticket.tier === 'tier0' || ticket.tier === 'tier1';
}

async function persistOutbound(
  ticket: SupportTicket,
  email: EmailPayload,
  to: string,
  dryRun: boolean,
  includeEscalation: boolean,
) {
  const timestamp = new Date().toISOString();
  if (dryRun) return;
  const payload = {
    ticketId: ticket.id,
    createdAt: timestamp,
    from: SUPPORT_FROM_ADDRESS,
    to,
    subject: email.subject,
    body: email.body,
    tier: ticket.tier,
    priorityScore: ticket.priorityScore,
    escalation: includeEscalation ? SUPPORT_ESCALATION_EMAILS : [],
  };
  const outFile = path.join(
    SUPPORT_OUTBOX_DIR,
    `${ticket.id.replace(/[:]/g, '-')}_${Date.now().toString(36)}.json`,
  );
  await fs.writeFile(outFile, JSON.stringify(payload, null, 2), 'utf8');
  if (includeEscalation && SUPPORT_ESCALATION_EMAILS.length) {
    const escalationFile = path.join(
      SUPPORT_ESCALATION_DIR,
      `${ticket.id.replace(/[:]/g, '-')}_${Date.now().toString(36)}.json`,
    );
    await fs.writeFile(
      escalationFile,
      JSON.stringify(
        {
          ticketId: ticket.id,
          createdAt: timestamp,
          recipients: SUPPORT_ESCALATION_EMAILS,
          note: 'High-priority ticket forwarded to leadership.',
        },
        null,
        2,
      ),
      'utf8',
    );
  }
}

async function updateTicketRecord(ticket: SupportTicket, email: EmailPayload, to: string, dryRun: boolean) {
  const updated: SupportTicket = {
    ...ticket,
    status: 'waiting_customer',
    acknowledgedAt: new Date().toISOString(),
    lastEmail: {
      at: new Date().toISOString(),
      subject: email.subject,
      to: [to],
      cc: shouldEscalate(ticket) ? SUPPORT_ESCALATION_EMAILS : undefined,
      model: openai ? 'gpt-4o-mini' : 'fallback-template',
    },
    history: [
      ...(ticket.history ?? []),
      {
        at: new Date().toISOString(),
        type: 'outbound',
        summary: 'Auto-acknowledgement sent',
        payload: { subject: email.subject, to },
      },
    ],
  };
  if (!dryRun) {
    const file = path.join(SUPPORT_INBOX_DIR, `${ticket.id}.json`);
    await fs.writeFile(file, JSON.stringify(updated, null, 2), 'utf8');
  }
  return updated;
}

async function main() {
  const args = parseArgs();
  await ensureDirs();
  const files = await listTicketFiles();
  if (files.length === 0) {
    console.log('📭 No support tickets on disk.');
    return;
  }
  const tickets: Array<{ ticket: SupportTicket; path: string }> = [];
  for (const file of files) {
    const fullPath = path.join(SUPPORT_INBOX_DIR, file);
    const ticket = await loadTicket(fullPath);
    tickets.push({ ticket, path: fullPath });
  }
  const selected = filterTickets(tickets, args);
  if (selected.length === 0) {
    console.log('ℹ️  No tickets matched the criteria.');
    return;
  }

  const processed: SupportTicket[] = [];
  for (const { ticket } of selected) {
    const recipient = ticket.contact?.email;
    if (!recipient) {
      console.warn(`⚠️  Ticket ${ticket.id} missing contact email. Skipping.`);
      continue;
    }
    const email = await draftEmail(ticket);
    const escalate = shouldEscalate(ticket);
    if (!args.json) {
      console.log(`✉️  ${ticket.id} → ${recipient} (${ticket.tier})${escalate ? ' [ESCALATE]' : ''}`);
    }
    await persistOutbound(ticket, email, recipient, args.dryRun, escalate);
    const updated = await updateTicketRecord(ticket, email, recipient, args.dryRun);
    processed.push(updated);
  }

  if (args.json) {
    console.log(JSON.stringify(processed, null, 2));
  } else {
    console.log(
      args.dryRun
        ? 'Dry run complete. No outbound messages persisted.'
        : `Saved ${processed.length} outbound message(s). Next command: npm run support-router`,
    );
  }
}

main().catch((error) => {
  console.error('emailAgent failed:', error);
  process.exit(1);
});
