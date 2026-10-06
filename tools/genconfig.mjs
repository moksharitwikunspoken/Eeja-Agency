// Generates admin/config.yml field lists from content/*.json
// Usage: node tools/genconfig.mjs   (re-run after extract if keys change)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const IMG = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
const VID = /\.(mp4|webm|mov)$/i;

function widgetFor(v) {
  if (typeof v !== 'string') return 'string';
  if (VID.test(v)) return 'file';
  if (IMG.test(v) && /^assets\//.test(v.replace(/^\//, ''))) return 'image';
  if (v.includes('\n') || v.length > 100) return 'text';
  return 'string';
}

function labelFor(v) {
  const one = String(v).replace(/\s+/g, ' ').trim();
  return one.length > 48 ? one.slice(0, 45) + '...' : one;
}

// YAML-safe single-line double-quoted string (valid YAML)
const q = (s) => JSON.stringify(String(s));

function fieldsFor(obj, hiddenKeys = new Set()) {
  return Object.entries(obj).map(([name, value]) => {
    const f = { label: labelFor(value) || name, name };
    if (hiddenKeys.has(name)) f.widget = 'hidden';
    else f.widget = widgetFor(value);
    if (f.widget === 'file') f.required = false;
    if (f.widget === 'image' && /thumb|hero|logo/i.test(name)) f.hint = undefined;
    return f;
  });
}

function emitFields(fields, indent) {
  const pad = ' '.repeat(indent);
  return fields
    .map((f) => {
      let s = `${pad}- {label: ${q(f.label)}, name: ${q(f.name)}, widget: ${f.widget}`;
      if (f.required === false) s += ', required: false';
      if (f.summary) s += `, summary: ${q(f.summary)}`;
      if (f.fields) s += `,\n${pad}  fields:\n${emitFields(f.fields, indent + 4)}${pad}}`;
      else s += '}';
      return s;
    })
    .join('\n');
}

const pageLabel = {
  '404': '404 Page',
  agency: 'Agency Page',
  contact: 'Contact Page',
  highlights: 'Highlights Page',
  index: 'Home Page',
  multimedia: 'Multimedia Page',
  playground: 'Playground Page',
  portfolio: 'Portfolio Page',
  typography: 'Typography Page',
};

const lines = [];
lines.push('# yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json');
lines.push('');
lines.push('backend:');
lines.push('  name: github');
lines.push('  repo: moksharitwikunspoken/Eeja-Agency');
lines.push('');
lines.push('media_folder: assets/images/uploads');
lines.push('public_folder: /assets/images/uploads');
lines.push('');
lines.push('collections:');

// Site settings (shared text + images)
lines.push('  - name: site');
lines.push('    label: Site Settings (logo, menu, footer)');
lines.push('    files:');
lines.push('      - name: general');
lines.push('        label: General text');
lines.push('        file: content/site.json');
lines.push('        fields:');
lines.push(emitFields(fieldsFor(load('content/site.json')), 10));
lines.push('      - name: images');
lines.push('        label: Images and videos');
lines.push('        file: content/images.json');
lines.push('        fields:');
lines.push(emitFields(fieldsFor(load('content/images.json')), 10));

// Pages
lines.push('  - name: pages');
lines.push('    label: Pages');
lines.push('    files:');
const pageFiles = readdirSync(join(ROOT, 'content'))
  .filter((f) => f.endsWith('.json') && !['site.json', 'images.json', 'projects.json'].includes(f) && !f.startsWith('portfolio-'))
  .sort();
for (const f of pageFiles) {
  const name = f.replace(/\.json$/, '');
  const obj = load(`content/${f}`);
  if (!Object.keys(obj).length) continue;
  lines.push(`      - name: ${name}`);
  lines.push(`        label: ${pageLabel[name] || name}`);
  lines.push(`        file: content/${f}`);
  lines.push('        fields:');
  lines.push(emitFields(fieldsFor(obj), 10));
}

// Project detail pages (page-specific text like pinned words, titles)
lines.push('  - name: project_pages');
lines.push('    label: Project detail pages');
lines.push('    files:');
const detailFiles = readdirSync(join(ROOT, 'content'))
  .filter((f) => f.startsWith('portfolio-') && f.endsWith('.json'))
  .sort();
for (const f of detailFiles) {
  const name = f.replace(/\.json$/, '');
  const obj = load(`content/${f}`);
  if (!Object.keys(obj).length) continue;
  const slug = name.replace(/^portfolio-/, '');
  const proj = (load('content/projects.json').projects || []).find((p) => p.slug === slug);
  lines.push(`      - name: ${name}`);
  lines.push(`        label: ${proj ? proj.title : slug}`);
  lines.push(`        file: content/${f}`);
  lines.push('        fields:');
  lines.push(emitFields(fieldsFor(obj), 10));
}

// Projects (cards in all listings + detail hero)
const HIDDEN = new Set(['slug', 'category_class', 'slide_inner_class', 'projectbgcolor', 'hl_slide_class', 'pg_trigger_class']);
const allKeys = [...new Set(load('content/projects.json').projects.flatMap((p) => Object.keys(p)))];
const projFields = allKeys
  .filter((k) => k !== 'next_slug')
  .map((k) => {
    const f = { label: k, name: k };
    if (HIDDEN.has(k)) f.widget = 'hidden';
    else if (k === 'hero' || k === 'thumb') f.widget = 'image';
    else if (k === 'video') {
      f.widget = 'file';
      f.required = false;
    } else if (k === 'featured') f.widget = 'boolean';
    else f.widget = 'string';
    return f;
  });
projFields.push({ label: 'Next project (slug)', name: 'next_slug', widget: 'string' });
lines.push('  - name: projects');
lines.push('    label: Projects (cards + detail hero)');
lines.push('    files:');
lines.push('      - name: all');
lines.push('        label: All projects');
lines.push('        file: content/projects.json');
lines.push('        fields:');
lines.push('          - label: Projects');
lines.push('            name: projects');
lines.push('            widget: list');
lines.push('            summary: "{{fields.title}}"');
lines.push('            fields:');
lines.push(emitFields(projFields, 14));

writeFileSync(join(ROOT, 'admin/config.yml'), lines.join('\n') + '\n');
console.log('wrote admin/config.yml');
