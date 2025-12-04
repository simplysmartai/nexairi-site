#!/usr/bin/env node
import fs from 'node:fs';

// Extract trailing meta JSON from an HTML file and print as JSON
const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/ingest_meta.mjs <path-to-html>'); process.exit(1); }
const html = fs.readFileSync(file,'utf8');
const m = html.match(/<!--\s*(\{[\s\S]*\})\s*-->/);
if (!m) { console.error('No meta JSON comment found'); process.exit(2); }
try {
  const meta = JSON.parse(m[1]);
  console.log(JSON.stringify(meta, null, 2));
} catch (e) {
  console.error('Meta JSON parse failed:', e.message);
  process.exit(3);
}

