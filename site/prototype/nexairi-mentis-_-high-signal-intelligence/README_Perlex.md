
# README_Perlex — Nexairi Orchestrator & Editorial Pipeline

This document describes the full scope, architecture, runbook, and operational details for the Nexairi article orchestration pipeline (Perplexity → OpenAI → Editorial/Legal/SEO/Image agents → Ingest → CI → Deploy).

Purpose
- Provide a single, actionable reference for running, extending, and operating the automated article pipeline that creates file-first posts (HTML content files + canonical `public/posts.json`).
- Enable non-interactive runs: Perplexity for research, OpenAI for writing, agent checks (fact-check / legal / SEO / image), ingestion, validation, and PR creation.

High-level architecture
- Research: Perplexity agent (or equivalent) gathers authoritative schedule and TV listings from specified sources (NCAA, ESPN, FBSchedules, BowlSeason, Fox, CBS). Produces structured JSON.
- Writing: OpenAI receives verified research JSON + a strict writing prompt, produces final article HTML with frontmatter and JSON-LD metadata.
- Agent checks: Fact-checker, Legal reviewer, Copy editor, SEO optimizer, Image agent (generate or source licensed hero/inline images). Each agent updates artifacts or marks items for human review.
- Ingest: `scripts/ingest-article.ts` normalizes frontmatter (canonical `contentFile`), updates `public/posts.json`, and performs validation. Fails fast on duplicates or schema errors and writes diagnostics to `reports/generate/`.
- CI: GitHub Actions run strict JSON parsing (`scripts/check-json.js`) and `scripts/validatePosts.ts` on PRs/commits. Husky pre-commit runs local checks.

Key repository files and locations
- Content: `public/content/<category>/...` (HTML posts)
- Canonical index: `public/posts.json` (consumed by client)
- Orchestrator scaffold: `scripts/orchestrate-bowl-post.js`
- Perplexity prompt template: `scripts/prompts/perplexity_query.txt`
- OpenAI write prompt: `scripts/prompts/openai_write_prompt.md`
- Article generator (local): `scripts/generate-article.js` (uses OpenAI)
- Ingest: `scripts/ingest-article.ts` (normalization, duplicate detection, diagnostics)
- Validation: `scripts/validatePosts.ts`, `scripts/check-json.js`
- CI workflow: `.github/workflows/validate-posts.yml` and `.github/workflows/orchestrate-bowl-post.yml`

Secrets & environment variables
- For local runs or Actions, the pipeline expects secrets (do NOT store them in repo):
  - `OPENAI_KEY` / `OPENAI_API_KEY` — OpenAI API key for writing & proofreading.
  - `PERPLEXITY_API_KEY` / `PERPLEXITY_API_URL` — Perplexity research API (optional, or provide the research JSON file).
  - `GITHUB_TOKEN` — used by orchestrator to push branches and open PRs (Actions provides one by default; use a PAT if more scope required).
  - Any image CDN / storage credentials used by the Image agent.

Run modes
- Local (recommended for development):
  1. Generate research JSON with your Perplexity agent, save as `perplexity-research.json`.
  2. Export secrets in PowerShell (example):
     ```powershell
     $env:PERPLEXITY_RESEARCH_PATH = ".\perplexity-research.json"
     $env:OPENAI_KEY = "sk-..."
     $env:GITHUB_TOKEN = "ghp_..."
     $env:GITHUB_REPOSITORY = "simplysmartai/nexairi-site"
     node .\scripts\orchestrate-bowl-post.js
     ```
  3. Review draft in `public/content/sports/` and the PR created by the script.

- GitHub Actions (automated):
  - Add secrets to the repo: `OPENAI_KEY`, `PERPLEXITY_API_KEY` (optional), `OPENAI_MODEL` (optional). Trigger the manual workflow or push to the draft branch `auto/bowl-guide-draft` to run the orchestrator using stored secrets.

Prompts & data contracts
- Perplexity research output MUST be a JSON array of objects with fields: `bowl_name`, `team1`, `team2`, `date` (YYYY-MM-DD), `kickoff_time_ET` (HH:MM), `tv_channel`, `venue`, `source_urls` (array). If multiple candidate rows exist, include them with `preferred:true` flagged.
- OpenAI writer receives the research JSON and must produce an HTML file with frontmatter fields:
  - `title`, `slug`, `date`, `author` (e.g., 'Jackson S.'), `category`, `summary`, `tags`, `imagePrompt`, `imageAlt`, `contentFile`/`contentPath` and full `contentHtml` (body containing per-game blocks).

Validation & safety checks
- `scripts/check-json.js` strictly parses `public/posts.json` and fails on parse errors.
- `scripts/validatePosts.ts` enforces schema: required fields, date format (ISO), category mapping (Lifestyle, Technology, Travel, Sports), and duplicate detection for id/slug.
- `scripts/ingest-article.ts` writes diagnostics into `reports/generate/duplicate-<slug>.json` and fails ingest on duplicates unless overridden by editorial decision.

Image handling
- Image agent should either select a licensed hero image or generate one via AI using `imagePrompt`. When generating AI imagery, attach `imageUrl` after upload and add a short usage note in the PR.
- Keep hero image size ~1600x900 and provide `imageAlt` in frontmatter.

Editorial / Legal / SEO checklist (to run before merge)
1. Fact-check dates/times/channels against ESPN/NCAA/FBSchedules/BowlSeason and list source URLs in the post.
2. Confirm TV channel rights and use network names (no logos unless licensed).
3. Confirm images are licensed or generated with acceptable rights; add `imageUrl` and attribution if needed.
4. Run copy-edit (house voice, grammar). Assign `Jackson S.` as the author.
5. Final SEO pass: meta description <=160 chars, title <=70 chars, JSON-LD (Article) present, canonical URL set.

CI & PR flow
- Commit flow: orchestrator writes draft file(s) and updates `public/posts.json`, runs local validators, creates branch `auto/bowl-guide-<topic>-<ts>` and opens a PR. PR template should request reviewers: Editorial, Legal, SEO.
- GitHub Actions: `validate-posts.yml` runs on PRs and pushes to ensure index + schema correctness. Husky pre-commit runs `check-json` and `validate-posts` locally.

Troubleshooting
- Common failure: `npm ci` fails in CI due to `prepare` script running `husky install` in shallow clones. Fix: `prepare` script is guarded to run only when `.git` exists. If CI still fails, verify `package-lock.json` in repo is in sync.
- If orchestrator fails with `OpenAI` errors: check `OPENAI_KEY` secret and the SDK method being used. Some SDK versions use `client.chat.completions.create` vs `client.responses.create`.
- If Perplexity responses are not valid JSON: run research manually and save `perplexity-research.json` for the orchestrator to consume.

Developer notes
- Prefer small, auditable changes; the orchestrator is intentionally conservative (fail-fast on duplicates and malformed frontmatter).
- The canonical field name for content is `contentFile` / `contentPath` — use this in all scripts and client components.

Next steps & optional improvements
- Add a staged preview site job to render preview posts from PR branches (faster editorial review).
- Add an authenticated CMS view for editorial approvals and image uploads (optional).
- Add automated TV/time verification (scraping or API integration) to reduce [VERIFY] flags.

Contact & ownership
- Platform owner: Nexairi editorial operations (assign maintainers in GitHub CODEOWNERS for `scripts/` and `public/content/`).

Appendix: Useful commands
- Run validators locally:
  ```powershell
  npm run check-json
  npm run validate-posts
  ```
- Run orchestrator locally (with secrets):
  ```powershell
  $env:PERPLEXITY_RESEARCH_PATH = ".\perplexity-research.json"
  $env:OPENAI_KEY = "sk-..."
  $env:GITHUB_TOKEN = "ghp_..."
  node .\scripts\orchestrate-bowl-post.js
  ```

---
This README_Perlex is intended to be the single source of truth for the Perplexity→OpenAI→ingest orchestration. If you'd like, I can also create a short `README.md` in `scripts/` with developer run commands and examples.
