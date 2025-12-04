#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [, , topic = 'Untitled'] = process.argv;
const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const briefDir = path.join('editorial','BRIEFS');
fs.mkdirSync(briefDir, { recursive: true });
const tpl = fs.readFileSync(path.join(briefDir,'brief_template.yaml'),'utf8');
const out = tpl.replace('topic: ""', `topic: "${topic}"`);
const outPath = path.join(briefDir, `${slug}.yaml`);
fs.writeFileSync(outPath, out);
console.log('Created', outPath);

