# Nexairi Customer Support Team Blueprint

## Mission & Guiding Principles
- Deliver premium, data-backed assistance that mirrors the "high-signal" editorial voice.
- Blend automation with human review so every resolution is explainable and auditable.
- Close the loop with product, editorial, and analytics teams within 24 hours of emerging issues.

## Support Scope
| Area | Included | Excluded/Redirect |
| --- | --- | --- |
| Reader experience | Newsletter delivery, account access, article corrections | Payments (handled by finance) |
| Partner/deals | Sponsorship inquiries, co-marketing requests | Legal contracts (legal) |
| Ops/tooling | Agent swarm anomalies, publish pipeline failures | Core infra outages (platform SRE) |
| Data/privacy | Consent inquiries, opt-outs, data export | Regulatory subpoenas (legal)

## Service Channels
1. **Email (primary)** – `support@nexairi.com`, auto-routed via support agent.
2. **In-site form** – Hooks into the same queue, enforces structured fields.
3. **Signal dashboards** – Automated alerts from analytics/publish agents create tickets.
4. **Executive red line** – `founder@nexairi.com` auto-forwards with priority flag for Tier 0 issues.

## Response Tiers & SLAs
| Tier | Example | SLA (ack / resolve) | Owner |
| --- | --- | --- | --- |
| Tier 0 Critical | Site outage, data leak | 5 min / 2 hr | Ops on-call + Dir. Support |
| Tier 1 Urgent | Broken post flow, sponsor issue | 15 min / 6 hr | Senior Support Specialist |
| Tier 2 Standard | Reader question, content request | 2 hr / 24 hr | Support Specialist |
| Tier 3 Advisory | Feature suggestion, research request | 1 day / backlog grooming | Research/Editorial liaison |

## Team Roles
- **Director of Support Programs** – owns standards, postmortems, hiring.
- **Senior Support Specialist (2x)** – handle Tier 0/1, train automation.
- **Support Specialist (3x)** – Tier 2 queue, documentation updates.
- **Automation Steward** – maintains support/email agents, alerts, metrics.
- **Knowledge Editor** – curates macros, FAQ, and incident logs.

## Core Responsibilities
- Maintain 99% SLA adherence per tier.
- Weekly review of agent escalations + intent misses.
- Sync with analytics team to turn recurring tickets into roadmap items.
- Ensure every ticket has classification, root cause, resolution artifact.

## Tooling Alignment
- Shared inbox + routing (Resend/Postmark webhooks -> Support agent script).
- Ticket ledger in `reports/support/` (JSON) mirrored to Notion/ClickUp.
- Incident channel in Slack/Teams for Tier 0/1 auto-posts.
- Dependency on existing agent swarm: researchTopic, seoOptimizer, publishAgent for cross-team escalations.

## Technical Workflow Overview
1. **Intake Layer**
	- Email ingress (Resend/Postmark or SES) forwards to `support-intake` webhook with DKIM/SPF validated headers.
	- Web forms submit to `/api/support-ticket`, enforcing topic, urgency, contact info, and consent.
	- Automated alerts from analytics/publish agents POST directly to the same endpoint with `source=system`.

2. **Classification & Routing**
	- `supportRouter.ts` (new agent) normalizes payloads, enriches with sentiment + priority via OpenAI `gpt-4o-mini`.
	- Tickets stored as JSON in `reports/support/inbox/<date>.json` and optionally synced to external tracker.
	- Routing rules:
	  - Tier 0/1 → notify Ops On-Call via Slack + SMS (Twilio) and auto-create incident doc.
	  - Tier 2 → queue for Support Specialists with suggested macro ID.
	  - Tier 3 → auto-tag as "Advisory" and add to backlog board.

3. **Email Agent Automation**
	- `emailAgent.ts` polls the ledger, drafts responses (JSON output) with guardrails: tone template, cite data sources.
	- Auto-respond for Tier 2 common intents (<2 mins). Otherwise handoff with AI suggestion embedded.
	- Tracks state transitions (`new`, `in_progress`, `waiting_customer`, `resolved`).

4. **Escalation Hooks**
	- `humanReviewQueue.ts` extended to accept support tickets needing editorial/legal input.
	- Incident resolver posts summary back to ticket via API so history stays centralized.
	- Publish agent can block deployments if open Tier 0 exists.

5. **Telemetry & Audits**
	- Daily `supportMetrics.ts` aggregates volume, SLA performance, CSAT proxy (👍/👎 links in emails).
	- Reports pushed to `reports/support/daily/<date>.json` + Slack digest.
	- Logs retained 365 days; PII redacted before long-term storage.

### Tooling Requirements
- Runtime: existing Node/TS stack (`tsx` scripts), sharing env var handling via `dotenv`.
- Secrets: `SUPPORT_WEBHOOK_TOKEN`, `RESEND_API_KEY`, `SLACK_SUPPORT_WEBHOOK`, `TWILIO_ACCOUNT_SID`, etc.
- Persistence: file-based JSON + optional Supabase table for dashboard queries.
- Monitoring: heartbeat check (GitHub Actions or cron) to ensure router + email agent run every 5 minutes.

## Implementation Roadmap
### Phase 0 – Foundations (Week 1)
- Stand up shared inbox + DNS records (SPF/DKIM/DMARC).
- Create `supportRouter.ts` + `emailAgent.ts` stubs; wire to staging webhook.
- Draft initial macros/FAQ with Knowledge Editor.

### Phase 1 – Pilot (Weeks 2-3)
- Recruit Director + two Senior Support Specialists.
- Run internal dogfood: route agent swarm alerts + team feedback only.
- Instrument SLA tracker + daily metrics exports.

### Phase 2 – Public Launch (Week 4)
- Expose support form + publish contact emails site-wide.
- Add automation guardrails (rate limiting, abuse detection).
- Enable auto-responses for top 5 intents; keep Tier 0/1 manual.

### Phase 3 – Scale & Optimization (Month 2+)
- Hire remaining specialists + automation steward.
- Integrate with CRM (HubSpot/Notion) for lifecycle visibility.
- Add CSAT micro-surveys and OKR reporting.

## KPIs & Reporting Cadence
- SLA adherence per tier (target ≥99% Tier 0/1, ≥97% Tier 2).
- First response time (FRT) median + 95th percentile.
- Auto-resolution rate (tickets solved without human edits).
- Escalation-to-resolution elapsed time.
- Ticket volume by source + intent trends.

Weekly review in Ops sync; monthly QBR with leadership.

## Immediate Next Actions
1. Approve tooling budget (Resend/Postmark, Twilio, Supabase).
2. Create env var entries in `.env.sample` for support stack.
3. Scaffold `scripts/supportRouter.ts` + `scripts/emailAgent.ts` (reuse existing lib helpers).
4. Publish support contact info in footer + `README.md` deployment docs.
5. Schedule hiring kickoff with People Ops (JD draft, sourcing).
