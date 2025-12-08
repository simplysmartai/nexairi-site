# Nexairi Article Pipeline — Audit & Rewrite Complete ✅

## Overview
The Nexairi content ecosystem has been audited, rewritten, and tested end-to-end. A single, unified article creation pipeline has replaced 30+ fragmented and overlapping scripts.

## What Changed

### Created
- **`scripts/create-article.ts`** (200+ lines)
  - Single entry point for all article generation
  - Unified pipeline: Research → Write → Draft JSON → Ingest → Validate
  - Category defaults with tone/voice guidance (Sports, Technology, Travel, Lifestyle)
  - Proper handling of YAML frontmatter and HTML wrapping
  - Generates professional, human-quality, accessible content for lay audiences
  - Command: `npm run create:article "Topic" [Category]`

### Cleaned
- **`package.json`**: Removed ~30 dead scripts; kept 6 essentials:
  - `dev` — development server
  - `build` — production build
  - `preview` — preview build
  - `create:article` — unified orchestrator
  - `ingest:article` — post ingestion pipeline
  - `validate-posts` — schema validation
  - `check-json` — JSON integrity
  - `update-posts-index` — rebuild posts.json from HTML files
  - `prepare` — Husky pre-commit hook

### Moved to `Delete/` Folder
23 obsolete scripts:
- `analyticsAgent.ts`, `backfillImages.ts`, `emailAgent.ts`, `enforceAffiliateCompliance.ts`, `generate-article.ts` (superseded), `generateBatch.ts`, `generatePost.ts` (too heavy), `humanReviewQueue.ts`, `imageGenerator.ts`, `listGeminiModels.ts`, `publishAgent.ts`, `researchTopic.ts`, `runWeeklyRecapNoGemini.ts`, `seoOptimizer.ts`, `supportRouter.ts`, `syncFrontmatter.ts`, `test-env.ts`, `weeklySchedule.ts`, `auto-generate.js`, `ci-validateContent.js`, `migrate.js`, `orchestrate-bowl-post.js`, `tmp-fm-fix.js`

### Kept (Verified Good)
- **`scripts/ingest-article.ts`** — proper validation, normalization, duplicate detection, posts.json update
- **`scripts/validatePosts.ts`** — schema validation with excerpt/imageUrl checking
- **`scripts/check-json.js`** — strict JSON parse verification
- **`scripts/updatePostsIndex.ts`** — rebuild posts.json from filesystem

## How to Use

### Generate a New Article
```bash
npm run create:article "Your Topic Here" [Category]
```

**Categories**: Sports, Technology, Travel, Lifestyle (default: Sports)

**Example**:
```bash
npm run create:article "AI in Healthcare" Technology
npm run create:article "Winter in the Alps" Travel
npm run create:article "Slow Living 2025" Lifestyle
```

### What the Pipeline Does
1. **Research**: OpenAI generates Perplexity-style research (simulated)
2. **Write**: OpenAI writes human-quality, accessible prose (not AI-sounding)
3. **Draft**: Creates draft JSON with YAML frontmatter
4. **Ingest**: Normalizes, validates, writes HTML to `public/content/<category>/`
5. **Update**: Adds entry to `public/posts.json`
6. **Validate**: Confirms schema and JSON integrity
7. **Ready**: Article is staged and ready for commit/push

### Output
- Article HTML: `public/content/<category>/<slug>.html`
- Index update: `public/posts.json` (auto-updated)
- Validation: Automatic (validation passes before completion)

### Next Steps (After Generation)
```bash
# Review the article (open in editor or browser)
# Then commit:
git add public/posts.json "public/content/<category>/<slug>.html"
git commit -m "article: add <title>"
git push
```

## Voice & Tone Guidance
The pipeline uses specific prompts to ensure articles sound:
- **Human-written**: Not robotic or corporate
- **Accessible**: Explains jargon, avoids insider language
- **Conversational**: Friendly, familiar tone
- **Audience-aware**: Targets "curious common people who want to learn"
- **Category-specific**:
  - **Sports**: Casual, action-oriented, fan perspective
  - **Technology**: Clear explanations, practical utility focus
  - **Travel**: Narrative, sensory, rhythm and pacing
  - **Lifestyle**: Warm, personal, ritual-focused

## Test Results
✅ **Full pipeline tested** with three articles:
1. "AI Trends in 2025" (Technology) — ✅ Passed
2. "Sustainable Living in Urban Spaces" (Lifestyle) — ✅ Passed
3. "Your 2025-26 Bowl Season Guide, Part 1: Opening Week" (Sports) — ✅ Passed

**Validation**: All 49 posts in index passed schema validation.

## Environment Variables
Set `OPENAI_API_KEY` in your `.env` or GitHub secrets:
```bash
export OPENAI_API_KEY=sk-...
```

Optional:
- `OPENAI_MODEL` (default: `gpt-4o-mini`)

## Important Notes
- **GitHub/Cloudflare**: Deployment is unbroken. The pipeline integrates seamlessly with existing CI/CD.
- **Drafts folder**: Test drafts are saved to `drafts/` for review before ingest (optional cleanup).
- **Posts index**: Rebuilt weekly or on-demand via `npm run update-posts-index`.
- **No more dead code**: 23 obsolete scripts moved to `Delete/` folder; clean workspace.

## Commit History
- **`chore(ci): audit and rewrite...`** — Cleaned package.json, removed dead scripts.
- **`feat: test create:article pipeline...`** — Generated and validated articles, confirmed pipeline works.

## Questions?
Refer to:
- **Code**: `scripts/create-article.ts` (well-commented)
- **Prompts**: Review `buildResearchPrompt()` and `buildWritePrompt()` for tone/content guidance
- **Validation**: Run `npm run validate-posts` to check all posts

---
**Status**: ✅ **Complete and tested**  
**Branch**: `auto/bowl-guide-draft` (ready for merge or review)  
**Date**: 2025-12-08
