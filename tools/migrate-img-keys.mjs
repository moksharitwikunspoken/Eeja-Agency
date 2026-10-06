// ONE-TIME migration: images.json keys were full paths (contain / and .),
// which Sveltia CMS rejects as field names. Rename keys to safe slugs and
// update all {{img:...}} tokens in HTML accordingly. Values (paths) unchanged.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const imgs = JSON.parse(readFileSync(join(ROOT, 'content/images.json'), 'utf8'));
const map = {};
const used = new Set();
for (const old of Object.keys(imgs)) {
  let slug = slugify(old) || 'img';
  let n = slug;
  let i = 2;
  while (used.has(n)) n = `${slug}-${i++}`;
  used.add(n);
  map[old] = n;
}
const renamed = {};
for (const [old, v] of Object.entries(imgs)) renamed[map[old]] = v;
const keys = Object.keys(renamed).sort();
const sorted = {};
for (const k of keys) sorted[k] = renamed[k];
writeFileSync(join(ROOT, 'content/images.json'), JSON.stringify(sorted, null, 2) + '\n');

let files = 0;
let count = 0;
for (const f of readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
  let s = readFileSync(join(ROOT, f), 'utf8');
  let changed = false;
  for (const [old, slug] of Object.entries(map)) {
    const from = `{{img:${old}}}`;
    if (s.includes(from)) {
      s = s.split(from).join(`{{img:${slug}}}`);
      changed = true;
      count++;
    }
  }
  if (changed) {
    writeFileSync(join(ROOT, f), s);
    files++;
  }
}
console.log(`renamed ${Object.keys(map).length} image keys in ${files} files (${count} tokens)`);
// safety: no old-style tokens may remain
for (const f of readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
  const s = readFileSync(join(ROOT, f), 'utf8');
  const leftover = [...s.matchAll(/\{\{img:([^}]*[/.][^}]*)\}\}/g)];
  if (leftover.length) {
    console.error(`LEFTOVER in ${f}:`, leftover.map((m) => m[0]).slice(0, 5));
    process.exitCode = 1;
  }
}
