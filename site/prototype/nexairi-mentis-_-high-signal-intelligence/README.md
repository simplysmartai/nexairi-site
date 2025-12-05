<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

[![Regenerate posts.json](https://github.com/simplysmartai/nexairi-site/actions/workflows/regenerate-posts.yml/badge.svg)](https://github.com/simplysmartai/nexairi-site/actions/workflows/regenerate-posts.yml)

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/13IRLC3FXXSPFM_kIrvua8JbwlrVd1vnx

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` (or export the same keys in Cloudflare) and fill in the required secrets (see table below).
3. Run the app:
   `npm run dev`

## Cloudflare Pages Deployment

- This repository already lives at the Vite app root, so Cloudflare's *Root Directory* can remain blank. If you embed this folder inside a larger monorepo, set the root to `site/prototype/nexairi-mentis-_-high-signal-intelligence`.
- Use `npm run build` as the *Build Command* and `dist` as the *Output Directory*.
- All nested Git metadata and submodule references have been removed, so the repo is now self-contained and can be cloned without needing `git submodule` commands.

## AI Content Pipeline Scripts

| Script | Purpose | Notes |
| --- | --- | --- |
| `npm run update-posts-index` | Scans `public/content/` and rebuilds `public/posts.json`. | Run after adding/editing any article file. CI enforces that the generated JSON is committed. |
| `npm run validate-posts` | Verifies every entry in `public/posts.json` **and** scans the HTML for ISO dates, missing summaries, Amazon affiliate tagging, and disclosure blocks. | Fails fast with actionable errors; wired into CI. |
| `npm run generate-post -- --genre technology --topic "Your Topic"` | Full agent orchestration (topic picker -> research -> draft -> copy-review agent -> hero-image agent -> affiliate/disclosure enforcement -> Gemini meta). Saves an HTML article and refreshes the index automatically. | Requires `OPENAI_API_KEY`; optional boosts: `PERPLEXITY_API_KEY`, `GEMINI_API_KEY`. |
| `npm run generate-batch -- --genres technology,lifestyle --per-genre 2 --topics "topic a|topic b"` | Sequentially runs the generator for multiple genres, optionally seeding topics via a `|`-delimited list. | Honors the same env vars as `generate-post`; add `--quiet` to suppress per-run reminders. |
| `npm run sync-frontmatter` | Rewrites every file under `public/content/` so the YAML frontmatter matches `posts.json` (category, summary, image, deterministic author). | Run after regenerating `posts.json` if you need the HTML files themselves to carry the metadata (e.g., manual edits). |
| `npm run enforce-affiliates` | Bulk-normalizes every Amazon link under `public/content/` and injects the disclosure block + frontmatter flag. | Run once after migrating legacy content, or anytime you detect manual edits that bypassed the guardrails. |

### Editorial agents & compliance

- **Copy-review agent** tightens tone, trims fluff, and ensures brand-safe structure after the first draft.
- **Image-sourcing agent** returns modern art direction (alt text, keywords, prompt) and injects a deterministic hero image URL.
- **Affiliate guardrail** rewrites every Amazon link with `?tag=nexairimentis-20` and appends the disclosure block (`<section data-component="affiliate-disclosure" ...>`). Validation fails if future manual edits remove the tag or disclosure.

Environment variables live in `.env.local` (ignored by Git). Use `.env.example` as your template:

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | ✅ yes | Powers editorial agents (`generate-post`, `seo-optimize`, `email-agent`, etc.). |
| `PERPLEXITY_API_KEY` | optional | Enables richer research inside `generate-post` / `researchTopic`. |
| `GEMINI_API_KEY` | optional | Required for Gemini-driven meta/image cues in `generate-post` and `image-agent`. |
| `API_KEY` | optional | Client-side Gemini demos (Pixel Studio, TLDR Slider, etc.) shown on the site. |
| `SUPPORT_FROM_ADDRESS` | optional (defaults to `support@nexairi.com`) | Sender used by the support email agent. |
| `SUPPORT_ESCALATION_EMAILS` | optional (defaults to `jimmy@nexairi.com`) | Comma-separated list of addresses notified for Tier 0/1 tickets. |

Workflow tip: run `npm run generate-post`, then `npm run validate-posts`, then `git status` before committing.

## Automated Content Workflow

- The `Generate Content Drafts` GitHub Action (`.github/workflows/content-bot.yml`) can run on a daily cron or on-demand via the **Run workflow** button. It uses `npm run generate-batch` followed by `npm run validate-posts`, then opens/updates a PR from `content-bot/auto` for human review.
- Required repository secrets:
   - `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GEMINI_API_KEY` – the same keys you use locally. Leave optional providers blank if you do not want that stage.
   - `BOT_GITHUB_TOKEN` – a fine-grained PAT with `contents` + `pull requests` write access so the workflow can push branches and open PRs. Store it as a repo secret; never commit `.env` files.
- Schedule defaults to 13:00 UTC daily. Override genres/topics/per-genre counts by supplying inputs when manually dispatching the workflow.
- Each run posts a concise summary in the PR body; approve/merge once the Cloudflare Pages preview looks good.
