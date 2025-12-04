<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/13IRLC3FXXSPFM_kIrvua8JbwlrVd1vnx

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cloudflare Pages Deployment

- This folder is the true repo root for the Vite app. If your Git provider still tracks a larger monorepo, set Cloudflare's *Root Directory* to `site/prototype/nexairi-mentis-_-high-signal-intelligence` so it builds from here.
- Use `npm run build` as the *Build Command* and `dist` as the *Output Directory*.
- All nested Git metadata and submodule references have been removed, so the repo is now self-contained and can be cloned without needing `git submodule` commands.

## AI Content Pipeline Scripts

| Script | Purpose | Notes |
| --- | --- | --- |
| `npm run update-posts-index` | Scans `public/content/` and rebuilds `public/posts.json`. | Run after adding/editing any article file. CI enforces that the generated JSON is committed. |
| `npm run validate-posts` | Verifies every entry in `public/posts.json` and its backing content file for duplicate slugs/IDs, ISO dates, missing summaries, etc. | Fails fast with actionable errors; wired into CI. |
| `npm run generate-post -- --genre technology --topic "Your Topic"` | Full agent orchestration (OpenAI topic/draft + Perplexity research + Gemini meta). Saves an HTML article and refreshes the index automatically. | Requires environment variables: `OPENAI_API_KEY`. Optional enhancements: `PERPLEXITY_API_KEY`, `GEMINI_API_KEY`. |
| `npm run generate-batch -- --genres technology,lifestyle --per-genre 2 --topics "topic a|topic b"` | Sequentially runs the generator for multiple genres, optionally seeding topics via a `|`-delimited list. | Honors the same env vars as `generate-post`; add `--quiet` to suppress per-run reminders. |

Environment variables live in your local `.env` and are ignored by Git. Example:

```
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=px-...
GEMINI_API_KEY=...
```

Workflow tip: run `npm run generate-post`, then `npm run validate-posts`, then `git status` before committing.

## Automated Content Workflow

- The `Generate Content Drafts` GitHub Action (`.github/workflows/content-bot.yml`) can run on a daily cron or on-demand via the **Run workflow** button. It uses `npm run generate-batch` followed by `npm run validate-posts`, then opens/updates a PR from `content-bot/auto` for human review.
- Required repository secrets:
   - `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GEMINI_API_KEY` – the same keys you use locally. Leave optional providers blank if you do not want that stage.
   - `BOT_GITHUB_TOKEN` – a fine-grained PAT with `contents` + `pull requests` write access so the workflow can push branches and open PRs. Store it as a repo secret; never commit `.env` files.
- Schedule defaults to 13:00 UTC daily. Override genres/topics/per-genre counts by supplying inputs when manually dispatching the workflow.
- Each run posts a concise summary in the PR body; approve/merge once the Cloudflare Pages preview looks good.
