#!/usr/bin/env node
// Lightweight static checks for legal risk. Not a substitute for counsel.
import fs from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/legal_scan.mjs <path-to-html>'); process.exit(1); }
const html = fs.readFileSync(file,'utf8');

const issues = [];

// 1) Long quoted blocks without closing quote or citation anchor
const quoteBlocks = (html.match(/“[^”]{120,}”/g) || []).length + (html.match(/"[^"]{120,}"/g) || []).length;
if (quoteBlocks > 0 && !/Sources|Verify|citations/i.test(html)) {
  issues.push({type:'plagiarism', severity:'med', where:'body', note:'Long quoted text found without a citations section', fix:'Add quotations and a citations list with source URLs'});
}

// 2) Missing alt attributes on images
if (/<img\s+[^>]*>(?!\s*<figcaption)/i.test(html) || /<img(?![^>]*alt=)/i.test(html)) {
  issues.push({type:'image', severity:'low', where:'img', note:'Images without alt text or figcaption', fix:'Add meaningful alt and figcaption with image_prompt'});
}

// 3) Brand/logo hints in image prompts
if (/Image prompt:[^<]*(logo|brand|trademark)/i.test(html)) {
  issues.push({type:'image', severity:'med', where:'figcaption', note:'Image prompt references brands/logos', fix:'Remove brand/logos; use neutral subjects'});
}

// 4) Medical/legal advice terms without disclaimer
if (/(medical advice|diagnose|treat|legal advice)/i.test(html) && !/Not medical advice|legal/i.test(html)) {
  issues.push({type:'claims', severity:'med', where:'body', note:'Advice language without disclaimer', fix:'Add standard disclaimer (see legal/DISCLAIMERS.md)'});
}

const risk = issues.some(i=>i.severity==='med' || i.severity==='high') ? 'moderate' : 'low';
console.log(JSON.stringify({risk, issues}));

