import fs from 'node:fs';
import path from 'node:path';

const scriptPath = path.resolve(process.argv[1] || 'tools/extract.mjs');
const ROOT = path.resolve(path.dirname(scriptPath), '..');
const CONTENT = path.join(ROOT, 'content');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, 'utf8');
}

function slugify(normalized) {
  let s = normalized.toLowerCase();
  s = s.replace(/&(?:#[0-9]+|#x[0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);/g, '');
  s = s.replace(/[^a-z0-9]+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  if (s.length > 40) {
    s = s.slice(0, 40);
    s = s.replace(/-+$/g, '');
  }
  if (!s) s = 'text';
  return s;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return !(aEnd <= bStart || aStart >= bEnd);
}

const allFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();
console.log('ROOT=' + ROOT);
console.log('HTML files in ROOT: ' + JSON.stringify(allFiles));

const skippedIdempotency = [];
const fileOriginals = new Map(); // file -> original string
const fileScanned = new Map(); // file -> scanned string
const fileAssetSpans = new Map(); // file -> [{start,end,path}]
const fileTextCands = new Map(); // file -> [{start,end,raw,normalized}]
const fileAttrCands = new Map(); // file -> [{start,end,raw,normalized,attr}]

const skippedDetails = []; // {file, kind, reason, preview}
const projectTokensBefore = new Map(); // file -> array of tokens

const ATTR_NAMES = ['alt','title','placeholder','data-hover','data-infotextbefore','data-infotextafter','data-firstline','data-secondline','data-centerline'];
const attrReSrc = '(?:\\s)(' + ATTR_NAMES.join('|') + ')\\s*=\\s*"([^"]*)"';

for (const file of allFiles) {
  const fp = path.join(ROOT, file);
  const original = read(fp);
  fileOriginals.set(file, original);

  if (original.includes('{{t:') || original.includes('{{img:')) {
    skippedIdempotency.push(file);
    continue;
  }

  // record project tokens before (for sanity)
  const projToks = [...original.matchAll(/\{\{project\.[a-z_]+\}\}/g)].map(m => m[0]);
  projectTokensBefore.set(file, projToks);

  // 2. scanned copy
  let scanned = original;
  scanned = scanned.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, m => ' '.repeat(m.length));
  scanned = scanned.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, m => ' '.repeat(m.length));
  scanned = scanned.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
  if (scanned.length !== original.length) {
    console.error('LENGTH MISMATCH after masking for ' + file);
    throw new Error('masking length mismatch');
  }
  fileScanned.set(file, scanned);

  // 3a. assets
  const assetSpans = [];
  const assetRe = /assets\/images\/[A-Za-z0-9_.\-\/]+/g;
  let m;
  while ((m = assetRe.exec(scanned)) !== null) {
    assetSpans.push({ start: m.index, end: m.index + m[0].length, path: m[0] });
  }
  fileAssetSpans.set(file, assetSpans);

  // 3b. text nodes
  const textCands = [];
  const textRe = />([^<>]+)</g;
  while ((m = textRe.exec(scanned)) !== null) {
    const inner = m[1];
    const start = m.index + 1;
    const end = start + inner.length;
    const normalized = inner.replace(/\s+/g, ' ').trim();
    if (normalized.length < 2) {
      continue;
    }
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(normalized)) {
      skippedDetails.push({ file, kind: 'text', reason: 'no-letter', preview: inner.slice(0, 80) });
      continue;
    }
    const trimmed = inner.trim();
    if (/^\{\{.*\}\}$/.test(inner) || /^\{\{.*\}\}$/.test(trimmed) || /^\{\{.*\}\}$/.test(normalized)) {
      skippedDetails.push({ file, kind: 'text', reason: 'project-token-exact', preview: inner.slice(0, 80) });
      continue;
    }
    if (inner.includes('{{') || inner.includes('}}') || inner.includes('{{project.')) {
      skippedDetails.push({ file, kind: 'text', reason: 'contains-template-syntax (project-token protection)', preview: inner.slice(0, 120) });
      continue;
    }
    // overlap with asset?
    let ov = false;
    for (const a of assetSpans) {
      if (overlaps(start, end, a.start, a.end)) { ov = true; break; }
    }
    if (ov) {
      skippedDetails.push({ file, kind: 'text', reason: 'overlaps-asset', preview: inner.slice(0, 80) });
      continue;
    }
    // safety: spans masked region? original slice contains < or >
    const origSlice = original.slice(start, end);
    if (origSlice.includes('<') || origSlice.includes('>')) {
      skippedDetails.push({ file, kind: 'text', reason: 'spans-masked-region (< or > in original)', preview: origSlice.slice(0, 80) });
      continue;
    }
    const raw = origSlice;
    textCands.push({ start, end, raw, normalized });
  }
  fileTextCands.set(file, textCands);

  // 3c. attributes
  const attrCands = [];
  const attrRe = new RegExp(attrReSrc, 'gi');
  while ((m = attrRe.exec(scanned)) !== null) {
    const full = m[0];
    const val = m[2];
    const attrName = m[1];
    const qIdx = full.indexOf('"');
    if (qIdx < 0) continue;
    const vStart = m.index + qIdx + 1;
    const vEnd = vStart + val.length;
    const trimmedCollapsed = val.replace(/\s+/g, ' ').trim();
    const trimmed = val.trim();
    if (trimmed.length < 2) {
      continue;
    }
    const low = trimmed.toLowerCase();
    if (low === 'open' || low === 'close') {
      skippedDetails.push({ file, kind: 'attr:' + attrName, reason: 'OPEN/CLOSE', preview: val.slice(0, 80) });
      continue;
    }
    if (val.includes('{{') || val.includes('}}')) {
      skippedDetails.push({ file, kind: 'attr:' + attrName, reason: 'contains-template-syntax', preview: val.slice(0, 80) });
      continue;
    }
    let ov = false;
    for (const a of assetSpans) {
      if (overlaps(vStart, vEnd, a.start, a.end)) { ov = true; break; }
    }
    if (ov) {
      skippedDetails.push({ file, kind: 'attr:' + attrName, reason: 'overlaps-asset', preview: val.slice(0, 80) });
      continue;
    }
    // safety: original slice must equal scanned value (not masked)
    const origVal = original.slice(vStart, vEnd);
    if (origVal !== val) {
      skippedDetails.push({ file, kind: 'attr:' + attrName, reason: 'masked-mismatch', preview: val.slice(0, 80) });
      continue;
    }
    const normalized = val.replace(/\s+/g, ' ').trim();
    attrCands.push({ start: vStart, end: vEnd, raw: origVal, normalized, attr: attrName });
  }
  fileAttrCands.set(file, attrCands);
}

// Group (b)+(c) by NORMALIZED
const groups = new Map(); // normalized -> {files:Set, firstRaw, firstFile, firstStart}
const processedFiles = [...fileOriginals.keys()].filter(f => !skippedIdempotency.includes(f)).sort();
for (const file of processedFiles) {
  const combined = [];
  for (const c of (fileTextCands.get(file) || [])) combined.push({ ...c, order: c.start });
  for (const c of (fileAttrCands.get(file) || [])) combined.push({ ...c, order: c.start });
  combined.sort((a, b) => a.order - b.order);
  for (const c of combined) {
    const norm = c.normalized;
    if (!groups.has(norm)) {
      groups.set(norm, { files: new Set(), firstRaw: c.raw, firstFile: file, firstStart: c.start });
    }
    groups.get(norm).files.add(file);
  }
}

// Slug assignment: deterministic sorted normalized order, GLOBAL uniqueness
const sortedNorms = [...groups.keys()].sort();
const usedSlugs = new Set();
const normToSlug = new Map();
for (const norm of sortedNorms) {
  const base = slugify(norm);
  let slug = base;
  let counter = 2;
  while (usedSlugs.has(slug)) {
    const suffix = '-' + counter;
    const allowedBaseLen = 40 - suffix.length;
    let tb = base.slice(0, allowedBaseLen).replace(/-+$/g, '');
    if (!tb) tb = 'x';
    slug = tb + suffix;
    counter++;
  }
  usedSlugs.add(slug);
  normToSlug.set(norm, slug);
}

// Build site/page/images data
const siteData = {};
const pageData = {}; // pagename -> {}
const imagesData = {};
for (const norm of sortedNorms) {
  const g = groups.get(norm);
  const slug = normToSlug.get(norm);
  if (g.files.size > 1) {
    siteData[slug] = g.firstRaw;
  } else {
    const onlyFile = [...g.files][0];
    const pagename = onlyFile.replace(/\.html$/, '');
    if (!pageData[pagename]) pageData[pagename] = {};
    pageData[pagename][slug] = g.firstRaw;
  }
}
// images: all asset paths
const allPaths = new Set();
for (const file of processedFiles) {
  for (const a of (fileAssetSpans.get(file) || [])) allPaths.add(a.path);
}
const sortedPaths = [...allPaths].sort();
for (const p of sortedPaths) imagesData[p] = p;

// Apply replacements END to START
const perFileStats = {}; // file -> {t: n, img: n}
for (const file of processedFiles) {
  const original = fileOriginals.get(file);
  const reps = [];
  for (const a of (fileAssetSpans.get(file) || [])) {
    reps.push({ start: a.start, end: a.end, token: `{{img:${a.path}}}`, kind: 'img' });
  }
  for (const c of (fileTextCands.get(file) || [])) {
    const slug = normToSlug.get(c.normalized);
    reps.push({ start: c.start, end: c.end, token: `{{t:${slug}}}`, kind: 't' });
  }
  for (const c of (fileAttrCands.get(file) || [])) {
    const slug = normToSlug.get(c.normalized);
    reps.push({ start: c.start, end: c.end, token: `{{t:${slug}}}`, kind: 't' });
  }
  // sort by start ascending to detect overlaps, then apply descending
  reps.sort((a, b) => a.start - b.start || a.end - b.end);
  const filtered = [];
  let lastEnd = -1;
  for (const r of reps) {
    if (r.start < lastEnd) {
      skippedDetails.push({ file, kind: r.kind, reason: 'replacement-overlap (dropped)', preview: r.token.slice(0, 80) + ' @' + r.start });
      continue;
    }
    filtered.push(r);
    lastEnd = r.end;
  }
  // apply END to START
  filtered.sort((a, b) => b.start - a.start);
  let out = original;
  let tCount = 0, imgCount = 0;
  for (const r of filtered) {
    out = out.slice(0, r.start) + r.token + out.slice(r.end);
    if (r.kind === 't') tCount++;
    else imgCount++;
  }
  fileOriginals.set(file, out); // reuse map for modified
  perFileStats[file] = { t: tCount, img: imgCount, totalReps: filtered.length };
}

// Write back HTML
const modifiedFiles = [];
for (const file of processedFiles) {
  const fp = path.join(ROOT, file);
  write(fp, fileOriginals.get(file));
  modifiedFiles.push(file);
}

// Write JSONs pretty, sorted keys
function sortedObj(o) {
  const r = {};
  for (const k of Object.keys(o).sort()) r[k] = o[k];
  return r;
}
write(path.join(CONTENT, 'site.json'), JSON.stringify(sortedObj(siteData), null, 2) + '\n');
write(path.join(CONTENT, 'images.json'), JSON.stringify(sortedObj(imagesData), null, 2) + '\n');
const writtenPageFiles = [];
for (const pg of Object.keys(pageData).sort()) {
  if (Object.keys(pageData[pg]).length === 0) continue;
  write(path.join(CONTENT, pg + '.json'), JSON.stringify(sortedObj(pageData[pg]), null, 2) + '\n');
  writtenPageFiles.push(pg + '.json');
}

// Print stats
console.log('--- per-file token counts ---');
for (const f of processedFiles) {
  const s = perFileStats[f];
  console.log(`${f}: t=${s.t} img=${s.img}`);
}
if (skippedIdempotency.length) console.log('skipped (idempotency, already contains {{t: or {{img:): ' + JSON.stringify(skippedIdempotency));
else console.log('skipped (idempotency): none');

const totalPageKeys = Object.values(pageData).reduce((n, o) => n + Object.keys(o).length, 0);
console.log(`total distinct site keys: ${Object.keys(siteData).length}`);
console.log(`total page keys (sum): ${totalPageKeys}`);
for (const pg of Object.keys(pageData).sort()) {
  console.log(`  page ${pg}.json keys: ${Object.keys(pageData[pg]).length}`);
}
console.log(`total image keys: ${Object.keys(imagesData).length}`);
console.log(`skipped/overlapping candidates: ${skippedDetails.length}`);
const byReason = {};
for (const d of skippedDetails) {
  const k = d.kind + '|' + d.reason;
  byReason[k] = (byReason[k] || 0) + 1;
}
for (const k of Object.keys(byReason).sort()) {
  console.log(`  skip ${k}: ${byReason[k]}`);
  // print up to 3 examples
  const ex = skippedDetails.filter(d => (d.kind + '|' + d.reason) === k).slice(0, 3);
  for (const e of ex) console.log(`    - ${e.file}: ${JSON.stringify(e.preview.slice(0, 100))}`);
}

// Sanity asserts
let pass = true;
function fail(msg) {
  console.error('FAIL: ' + msg);
  pass = false;
}
// merged map per page
const siteMap = siteData;
for (const file of processedFiles) {
  const fp = path.join(ROOT, file);
  const html = read(fp);
  const pagename = file.replace(/\.html$/, '');
  const pageMap = pageData[pagename] || {};
  const merged = { ...siteMap, ...pageMap };

  const tToks = [...html.matchAll(/\{\{t:([^}]+)\}\}/g)].map(m => m[1]);
  for (const key of tToks) {
    if (!(key in merged)) fail(`${file}: {{t:${key}}} not found in merged map (site+${pagename}.json)`);
  }
  const imgToks = [...html.matchAll(/\{\{img:([^}]+)\}\}/g)].map(m => m[1]);
  for (const p of imgToks) {
    if (!(p in imagesData)) fail(`${file}: {{img:${p}}} not found in images.json`);
  }
  // project tokens: compare before/after
  const before = projectTokensBefore.get(file) || [];
  const after = [...html.matchAll(/\{\{project\.[a-z_]+\}\}/g)].map(m => m[0]);
  // check well-formedness: any '{{project.' must be well-formed
  const projOpens = (html.match(/\{\{project\./g) || []).length;
  if (projOpens !== after.length) {
    fail(`${file}: malformed {{project. token detected (opens=${projOpens} wellformed=${after.length})`);
  }
  // check no damage: after must contain same multiset as before
  const countMap = arr => {
    const o = {};
    for (const x of arr) o[x] = (o[x] || 0) + 1;
    return o;
  };
  const bc = countMap(before), ac = countMap(after);
  const allKeys = new Set([...Object.keys(bc), ...Object.keys(ac)]);
  for (const k of allKeys) {
    if ((bc[k] || 0) !== (ac[k] || 0)) {
      fail(`${file}: project token ${k} count changed before=${bc[k] || 0} after=${ac[k] || 0}`);
    }
  }
  // also ensure no leftover '{{t:' inside project or vice versa? already covered
}
if (pass) console.log('SANITY: PASS');
else console.log('SANITY: FAIL');

if (!pass) process.exit(1);
