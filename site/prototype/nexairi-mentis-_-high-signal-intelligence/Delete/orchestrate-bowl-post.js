#!/usr/bin/env node
"use strict";
// Orchestrator script (safe, requires API keys via env or a pre-generated research JSON file)
// Usage:
//  - Provide research JSON path via env: PERPLEXITY_RESEARCH_PATH=./research.json node scripts/orchestrate-bowl-post.js
//  - Or provide PERPLEXITY_API_URL and PERPLEXITY_API_KEY to run the research step, and OPENAI_KEY to run the write step.

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const OUT_DIR = path.join(__dirname, '..', 'public', 'content', 'sports');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function exitErr(msg) {
  console.error(msg);
  process.exit(1);
}

async function run() {
  const researchPath = process.env.PERPLEXITY_RESEARCH_PATH;
  let research;

  if (researchPath && fs.existsSync(researchPath)) {
    research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
    console.log('Loaded research JSON from', researchPath);
  } else if (process.env.PERPLEXITY_API_URL && process.env.PERPLEXITY_API_KEY) {
    // Attempt to post the prompt to Perplexity-like API
    const query = fs.readFileSync(path.join(__dirname, 'prompts', 'perplexity_query.txt'), 'utf8');
    console.log('Calling Perplexity API at', process.env.PERPLEXITY_API_URL);
    const resp = await fetch(process.env.PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({ prompt: query })
    });
    if (!resp.ok) exitErr('Perplexity API call failed: ' + resp.statusText);
    research = await resp.json();
    // Expect research to be a JSON array; if it's a string, attempt to parse
    if (typeof research === 'string') {
      try { research = JSON.parse(research);} catch(e) {}
    }
    fs.writeFileSync(path.join(process.cwd(), 'perplexity-research.json'), JSON.stringify(research, null, 2));
    console.log('Saved research to perplexity-research.json');
  } else {
    exitErr('No research source found. Set PERPLEXITY_RESEARCH_PATH or PERPLEXITY_API_URL + PERPLEXITY_API_KEY.');
  }

  if (!Array.isArray(research)) {
    console.log('Research payload is not an array. Saving raw research to research-raw.json and exiting.');
    fs.writeFileSync('research-raw.json', JSON.stringify(research, null, 2));
    process.exit(0);
  }

  // Prepare the OpenAI prompt
  const openaiPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'openai_write_prompt.md'), 'utf8');
  const payload = {
    research,
    prompt: openaiPrompt
  };

  if (!process.env.OPENAI_KEY) {
    exitErr('OPENAI_KEY is required to run the writing step. Set env OPENAI_KEY or provide an already-written HTML file.');
  }

  console.log('Calling OpenAI to generate article (this requires OPENAI_KEY)');
  const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an experienced sports editor writing for Nexairi Sports. Maintain clear, authoritative tone. Author: Jackson S.' },
        { role: 'user', content: JSON.stringify(payload) }
      ],
      max_tokens: 4000
    })
  });
  if (!openaiResp.ok) exitErr('OpenAI request failed: ' + openaiResp.statusText);
  const openaiJson = await openaiResp.json();
  const articleText = openaiJson?.choices?.[0]?.message?.content;
  if (!articleText) exitErr('OpenAI did not return article content.');

  // Determine slug from title in frontmatter (naive)
  const slugMatch = articleText.match(/slug:\s*([a-z0-9\-]+)/i);
  const slug = slugMatch ? slugMatch[1] : `bowl-season-part1-${Date.now()}`;
  const outPath = path.join(OUT_DIR, `${slug}.html`);
  fs.writeFileSync(outPath, articleText, 'utf8');
  console.log('Wrote draft to', outPath);

  // Run validations
  try {
    console.log('Running JSON & posts validation');
    child_process.execSync('npm run check-json', { stdio: 'inherit' });
    child_process.execSync('npm run validate-posts', { stdio: 'inherit' });
  } catch (e) {
    console.error('Validation failed. Please inspect output and fix issues.');
    process.exit(1);
  }

  // Commit to branch and open PR (requires GITHUB_TOKEN)
  if (!process.env.GITHUB_TOKEN) {
    console.log('GITHUB_TOKEN not set. Skipping git commit / PR creation.');
    process.exit(0);
  }

  const branch = `auto/bowl-guide-part1-${Date.now()}`;
  child_process.execSync(`git checkout -b ${branch}`);
  child_process.execSync(`git add ${outPath} public/posts.json`);
  child_process.execSync(`git commit -m "chore(content): add bowl guide draft (opening week)"`);
  child_process.execSync(`git push origin ${branch}`);

  // Create PR using GitHub API
  const repo = process.env.GITHUB_REPOSITORY || (() => { console.log('GITHUB_REPOSITORY not set, skipping PR creation.'); return null; })();
  if (!repo) return console.log('Done (branch pushed). Create a PR in GitHub to continue.');

  const [owner, repoName] = repo.split('/');
  const prResp = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'nexairi-orchestrator'
    },
    body: JSON.stringify({ title: 'Draft: Your 2025–26 Bowl Season Guide, Part 1 (Opening Week)', head: branch, base: 'main', body: 'Automated draft created by orchestrator. Review: fact-check dates/times/channels, images, and SEO.' })
  });
  const prJson = await prResp.json();
  console.log('Created PR:', prJson.html_url || JSON.stringify(prJson));
}

run().catch(e => { console.error(e); process.exit(1); });
