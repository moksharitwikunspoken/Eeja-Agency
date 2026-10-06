// Eeja Agency static build: content/*.json + templates/cards/* -> dist/
// Usage: node tools/build.mjs   (also: npm run build)
// Cloudflare Pages: build command "npm run build", output directory "dist".
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const warnings = [];
const warn = (m) => warnings.push(m);

const site = JSON.parse(readFileSync(join(ROOT, 'content/site.json'), 'utf8'));
const images = JSON.parse(readFileSync(join(ROOT, 'content/images.json'), 'utf8'));
const { projects } = JSON.parse(readFileSync(join(ROOT, 'content/projects.json'), 'utf8'));
const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));

const pageJson = (name) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, `content/${name}.json`), 'utf8'));
  } catch {
    return {};
  }
};

const pad2 = (n) => String(n).padStart(2, '0');

function videoBlock(url, playsinline) {
  if (!url) return '';
  return `<div class="hero-video-wrapper"><video loop muted${playsinline ? ' playsinline' : ''} class="bgvid"><source src="${url}" type="video/mp4"></video></div>`;
}

function renderCard(tpl, p, i, total, inlineVideo) {
  return tpl
    .replaceAll('{{project.video_block}}', videoBlock(p.video, !inlineVideo))
    .replace(/\{\{project\.([\w]+)\}\}/g, (_, k) => {
      const v = p[k];
      if (v === undefined || v === null) {
        warn(`missing project field "${k}" for ${p.slug}`);
        return '';
      }
      return String(v);
    })
    .replaceAll('{{i}}', String(i))
    .replaceAll('{{i1}}', String(i + 1))
    .replaceAll('{{i2}}', pad2(i + 1))
    .replaceAll('{{total}}', String(total))
    .replaceAll('{{total2}}', pad2(total));
}

const cardTpl = (n) => readFileSync(join(ROOT, 'templates/cards', n), 'utf8');
const T = {
  index_images: cardTpl('index_images.html'),
  index_thumbs: cardTpl('index_thumbs.html'),
  index_captions: cardTpl('index_captions.html'),
  portfolio_grid: cardTpl('portfolio_grid.html'),
  hl_slides: cardTpl('hl_slides.html'),
  hl_canvas: cardTpl('hl_canvas.html'),
  pg_main: cardTpl('pg_main.html'),
  pg_sync: cardTpl('pg_sync.html'),
};

function loop(tpl, list, inlineVideo) {
  return list.map((p, i) => renderCard(tpl, p, i, list.length, inlineVideo)).join('');
}

function renderProjects(marker, page) {
  const all = projects;
  const featured = projects.filter((p) => p.featured);
  switch (marker) {
    case 'index_snap': {
      const imgs = loop(T.index_images, featured, true);
      const thumbs = loop(T.index_thumbs, featured, true);
      const caps = loop(T.index_captions, featured, true);
      return `<div class="snap-slider-holder"><div class="snap-slider-images"><div class="snap-slider-images-wrapper">${imgs}</div></div></div><div class="snap-slider-thumbs"><div class="snap-slider-thumbs-wrapper">${thumbs}</div></div></div><div class="snap-slider-captions"><div class="snap-slider-captions-wrapper content-full-width">${caps}</div></div></div>`;
    }
    case 'portfolio_grid':
      return loop(T.portfolio_grid, all, false);
    case 'hl_slides':
      return loop(T.hl_slides, all, false);
    case 'hl_canvas':
      return loop(T.hl_canvas, all, false);
    case 'pg_main':
      return loop(T.pg_main, all, false);
    case 'pg_sync':
      return loop(T.pg_sync, all, false);
    default:
      warn(`unknown PROJECTS marker "${marker}" in ${page}`);
      return '';
  }
}

function buildPage(file) {
  const name = file.replace(/\.html$/, '');
  let html = readFileSync(join(ROOT, file), 'utf8');

  // 1. project listing markers
  html = html.replace(/<!--PROJECTS:([\w]+)-->/g, (_, marker) => renderProjects(marker, file));

  // 2. {{project.*}} tokens (only meaningful on portfolio-<slug>.html pages)
  const m = name.match(/^portfolio-(.+)$/);
  const proj = m ? bySlug[m[1]] : null;
  html = html.replace(/\{\{project\.([\w]+)\}\}/g, (_, key) => {
    if (!proj) {
      warn(`{{project.${key}}} on non-project page ${file}`);
      return '';
    }
    const next = bySlug[proj.next_slug] || projects[(projects.indexOf(proj) + 1) % projects.length];
    const map = {
      title: proj.title,
      hero: proj.hero,
      next_slug: proj.next_slug,
      next_title: next.title,
      next_hero: next.hero,
    };
    if (!(key in map)) {
      warn(`unknown project key "${key}" in ${file}`);
      return '';
    }
    return map[key];
  });

  // 3. {{t:key}} text tokens (page json overrides nothing; site + page merged)
  const kv = { ...site, ...pageJson(name) };
  html = html.replace(/\{\{t:([\w-]+)\}\}/g, (_, key) => {
    if (!(key in kv)) {
      warn(`unresolved text token "${key}" in ${file}`);
      return `{{t:${key}}}`;
    }
    return kv[key];
  });

  // 4. {{img:path}} image tokens (strip one leading slash from CMS-saved values)
  html = html.replace(/\{\{img:([^}]+)\}\}/g, (_, p) => {
    if (!(p in images)) {
      warn(`unresolved image token "${p}" in ${file}`);
      return `{{img:${p}}}`;
    }
    return String(images[p]).replace(/^\//, '');
  });

  return html;
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
for (const file of pages) {
  writeFileSync(join(DIST, file), buildPage(file));
}
if (existsSync(join(ROOT, 'assets'))) cpSync(join(ROOT, 'assets'), join(DIST, 'assets'), { recursive: true });
if (existsSync(join(ROOT, 'admin'))) cpSync(join(ROOT, 'admin'), join(DIST, 'admin'), { recursive: true });

console.log(`built ${pages.length} pages -> dist/`);
if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  for (const w of warnings.slice(0, 40)) console.log(' -', w);
} else {
  console.log('no warnings');
}
