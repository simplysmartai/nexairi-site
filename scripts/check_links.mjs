#!/usr/bin/env node
import fs from 'node:fs';
import https from 'node:https';

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/check_links.mjs <path-to-html>'); process.exit(1); }
const html = fs.readFileSync(file,'utf8');
const urls = Array.from(new Set(Array.from(html.matchAll(/https?:\/\/[^"'>\s)]+/g)).map(m=>m[0])));
console.log('Found', urls.length, 'links');

const get = url => new Promise(res=>{
  https.get(url, r=>{ res({url, status:r.statusCode}); }).on('error', ()=>res({url, status:0}));
});

(async () => {
  const results = await Promise.all(urls.map(get));
  for (const r of results) console.log(r.status, r.url);
})();

