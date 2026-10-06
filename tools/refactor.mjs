// STEP 1 CMS-ification refactor script.
// Operates on work dir (parent of tools/). Never touches /tmp/eeja-orig (read-only).
// Run: node tools/refactor.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ORIG = '/tmp/eeja-orig';

function assert(cond, msg) {
  if (!cond) {
    console.error('ASSERTION FAILED: ' + msg);
    throw new Error('ASSERTION FAILED: ' + msg);
  }
}
function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, 'utf8');
}
function countOcc(hay, needle) {
  if (!needle) return 0;
  return hay.split(needle).length - 1;
}

// depth-count <div vs </div> from an opening <div ...> marker to its matching close.
function depthExtract(html, marker) {
  const idx = html.indexOf(marker);
  assert(idx >= 0, `marker not found: ${marker}`);
  const openEnd = html.indexOf('>', idx);
  assert(openEnd >= 0, `no > for marker: ${marker}`);
  const contentStart = openEnd + 1;
  let depth = 1;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = contentStart;
  let m;
  let innerEnd = -1, closeEnd = -1;
  while ((m = re.exec(html)) !== null) {
    if (m[0] === '<div') depth++;
    else depth--;
    if (depth === 0) {
      innerEnd = m.index;
      const gt = html.indexOf('>', m.index);
      assert(gt >= 0, 'no > for closing div');
      closeEnd = gt + 1;
      break;
    }
  }
  assert(innerEnd >= 0 && closeEnd >= 0, `no matching close for: ${marker}`);
  return { idx, openEnd, contentStart, innerEnd, closeEnd, inner: html.slice(contentStart, innerEnd) };
}

// ---------- PROJECT DATA (authoritative) ----------
const PROJECTS_BASE = [
  { slug: 'son-of-a-tailor', title: 'Son of a Tailor', category: 'Branding', category_class: 'branding', year: 2025, hero: 'assets/images/01hero.jpg', thumb: 'assets/images/01hero1.jpg', featured: true, next_slug: 'vx-lab' },
  { slug: 'stena-air', title: 'Stena Air', category: 'Web Design', category_class: 'web-design', year: 2025, hero: 'assets/images/02hero.jpg', thumb: 'assets/images/02hero1.jpg', featured: true, next_slug: 'son-of-a-tailor' },
  { slug: 'the-infin', title: 'Lounge Chair', category: 'Photography', category_class: 'photography-2', year: 2025, hero: 'assets/images/03hero.jpg', thumb: 'assets/images/03hero1.jpg', featured: true, next_slug: 'stena-air' },
  { slug: 'the-invincibles', title: 'The Invincibles', category: 'Video Production', category_class: 'video-production', year: 2025, hero: 'assets/images/04hero.jpg', thumb: 'assets/images/04hero_webgl.jpg', video: 'assets/images/04hero.mp4', featured: true, next_slug: 'the-infin' },
  { slug: 'kivira-naturals', title: 'Kivira Naturals', category: 'Graphic Desin', category_class: 'graphic-desin', year: 2025, hero: 'assets/images/05hero.jpg', thumb: 'assets/images/05hero1.jpg', featured: false, next_slug: 'the-invincibles' },
  { slug: 'voxa-speaker', title: 'Voxa Speaker', category: 'Product Design', category_class: 'product-design', year: 2025, hero: 'assets/images/06hero.jpg', thumb: 'assets/images/06hero1.jpg', featured: false, next_slug: 'kivira-naturals' },
  { slug: 'nanotech-agency', title: 'Nanotech Agency', category: 'Graphic Desin', category_class: 'graphic-desin', year: 2025, hero: 'assets/images/07hero.jpg', thumb: 'assets/images/07hero1.jpg', featured: false, next_slug: 'voxa-speaker' },
  { slug: 'vx-lab', title: 'VFX Lab', category: 'Photo', category_class: 'photography', year: 2025, hero: 'assets/images/08hero.jpg', thumb: 'assets/images/08hero1.jpg', featured: false, next_slug: 'nanotech-agency' },
];

const EXPECTED_SLIDE_INNER = {
  'son-of-a-tailor': 'slide-inner trigger-item no-change-header',
  'stena-air': 'slide-inner trigger-item no-change-header',
  'the-infin': 'slide-inner trigger-item no-change-header',
  'the-invincibles': 'slide-inner trigger-item no-change-header',
  'kivira-naturals': 'slide-inner trigger-item change-header',
  'voxa-speaker': 'slide-inner trigger-item no-change-header',
  'nanotech-agency': 'slide-inner trigger-item no-change-header',
  'vx-lab': 'slide-inner trigger-item no-change-header',
};
const EXPECTED_BGCOLOR = {
  'son-of-a-tailor': '#c8c8c8',
  'stena-air': '#b8b6a7',
  'the-infin': '#0c0c0c',
  'the-invincibles': '#192327',
  'kivira-naturals': '#f0efeb',
  'voxa-speaker': '#0c0c0c',
  'nanotech-agency': '#c8c8c8',
  'vx-lab': '#4b4d4f',
};

console.log('ROOT=' + ROOT);
console.log('Verifying /tmp/eeja-orig untouched (read-only checks)...');

// ---- Pre-verification from backups (/tmp/eeja-orig) ----
const origPortfolio = read(path.join(ORIG, 'portfolio.html'));
const origPlayground = read(path.join(ORIG, 'playground.html'));
const origHighlights = read(path.join(ORIG, 'highlights.html'));

// B: slide_inner_class + href order from backup portfolio
{
  const { inner } = depthExtract(origPortfolio, '<div class="showcase-portfolio expand-grid">');
  const hrefs = [...inner.matchAll(/href="(portfolio-[^"]+\.html)"/g)].map(m => m[1]);
  console.log('B backup href order:', JSON.stringify(hrefs));
  const expectedHrefs = PROJECTS_BASE.map(p => `portfolio-${p.slug}.html`);
  assert(JSON.stringify(hrefs) === JSON.stringify(expectedHrefs), `portfolio href order mismatch. got ${JSON.stringify(hrefs)} want ${JSON.stringify(expectedHrefs)}`);
  const slideInners = [...inner.matchAll(/<div class="(slide-inner[^"]*)"/g)].map(m => m[1]);
  console.log('B backup slide-inner classes:', JSON.stringify(slideInners));
  assert(slideInners.length === 8, `expected 8 slide-inner, got ${slideInners.length}`);
  const noChange = slideInners.filter(s => s === 'slide-inner trigger-item no-change-header').length;
  const change = slideInners.filter(s => s === 'slide-inner trigger-item change-header').length;
  console.log(`B backup slide-inner: ${noChange}x no-change-header, ${change}x change-header`);
  assert(noChange === 7 && change === 1, `expected 7x no-change + 1x change, got ${noChange} + ${change}`);
  // which project is change-header? index 4 => kivira-naturals
  const changeIdx = slideInners.findIndex(s => s.includes('change-header') && !s.includes('no-change'));
  console.log('B backup change-header project index:', changeIdx, 'slug:', PROJECTS_BASE[changeIdx].slug);
  assert(PROJECTS_BASE[changeIdx].slug === 'kivira-naturals', 'change-header should be kivira-naturals');
  // verify against EXPECTED table
  PROJECTS_BASE.forEach((p, i) => {
    assert(slideInners[i] === EXPECTED_SLIDE_INNER[p.slug], `slide_inner mismatch for ${p.slug}: got ${slideInners[i]}`);
  });
}

// E pg_main projectbgcolor verification from backup
{
  const { inner } = depthExtract(origPlayground, '<div class="clapat-slider-viewport">');
  const colors = [...inner.matchAll(/data-projectbgcolor="([^"]*)"/g)].map(m => m[1]);
  console.log('E backup pg_main projectbgcolor:', JSON.stringify(colors));
  assert(colors.length === 8, `expected 8 projectbgcolor, got ${colors.length}`);
  PROJECTS_BASE.forEach((p, i) => {
    assert(colors[i] === EXPECTED_BGCOLOR[p.slug], `projectbgcolor mismatch for ${p.slug}: got ${colors[i]} want ${EXPECTED_BGCOLOR[p.slug]}`);
  });
  console.log('E VERIFIED pg_main projectbgcolor per project: son #c8c8c8, stena #b8b6a7, infin #0c0c0c, invincibles #192327, kivira #f0efeb, voxa #0c0c0c, nanotech #c8c8c8, vxlab #4b4d4f');
}

// E hl active verification
{
  const { inner } = depthExtract(origHighlights, '<div class="clapat-slider-viewport">');
  const wraps = [...inner.matchAll(/<div class="slide-wrap([^"]*)" data-slide="([^"]*)">/g)].map(m => ({ cls: m[1], slide: m[2], full: m[0] }));
  console.log('E backup hl slide-wrap divs:', JSON.stringify(wraps.map(w => w.full)));
  const activeCount = wraps.filter(w => w.cls.includes('active')).length;
  console.log(`E VERIFY hl active: all ${wraps.length} slides have 'active'? activeCount=${activeCount}`);
  assert(wraps.length === 8, `expected 8 slide-wraps, got ${wraps.length}`);
  // Report: spec hypothesized only first has active; truth:
  if (activeCount === 8) {
    console.log('E FINDING: ALL 8 hl slides (0..7) have class "active" in original — NOT just first. Template uses {{active}} conditional (build inserts " active" for i==0 else "") which NORMALIZES to single-active; this differs from original for i>0 but follows task spec.');
  } else if (activeCount === 1) {
    console.log('E VERIFIED: only first slide has active.');
  } else {
    console.log(`E FINDING: ${activeCount}/8 slides have active.`);
  }
}

// E pg_sync verification: all identical?
{
  const { inner } = depthExtract(origPlayground, '<div class="clapat-sync-slider-viewport">');
  const bg = [...inner.matchAll(/data-projectbgcolor="([^"]*)"/g)].map(m => m[1]);
  const fg = [...inner.matchAll(/data-projectcolor="([^"]*)"/g)].map(m => m[1]);
  console.log('E backup pg_sync bgcolor:', JSON.stringify(bg));
  console.log('E backup pg_sync color:', JSON.stringify(fg));
  const allBgSame = bg.length === 8 && bg.every(v => v === bg[0]);
  const allFgSame = fg.length === 8 && fg.every(v => v === fg[0]);
  console.log(`E VERIFY pg_sync identical? bgcolor allSame=${allBgSame} (${bg[0]}), color allSame=${allFgSame} (${fg[0]})`);
  assert(allBgSame && allFgSame, 'pg_sync colors not all identical');
  assert(bg[0] === '#4b4d4f' && fg[0] === '#9c505f', `pg_sync expected #4b4d4f/#9c505f got ${bg[0]}/${fg[0]}`);
  console.log('E DECISION: pg_sync colors ALL identical → hardcode in template (no per-project fields).');
}

// ---------- Build projects array with derived fields ----------
const projects = PROJECTS_BASE.map(p => {
  const o = { ...p };
  o.slide_inner_class = EXPECTED_SLIDE_INNER[p.slug];
  o.projectbgcolor = EXPECTED_BGCOLOR[p.slug];
  return o;
});

// Write content/projects.json
{
  const out = { projects };
  write(path.join(ROOT, 'content', 'projects.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('WROTE content/projects.json with ' + projects.length + ' projects in order: ' + projects.map(p => p.slug).join(', '));
}

// ---------- A) INDEX.HTML ----------
{
  const fp = path.join(ROOT, 'index.html');
  let html = read(fp);
  const startM = '<!-- Portfolio Projects List -->';
  const endM = '<!--/Portfolio Projects List-->';
  const i1 = html.indexOf(startM);
  const i2 = html.indexOf(endM);
  assert(i1 >= 0 && i2 >= 0 && i2 > i1, 'index markers not found');
  const span = html.slice(i1, i2 + endM.length);
  const nPortfolio = countOcc(span, 'portfolio-');
  console.log(`A index removed span portfolio- count = ${nPortfolio}`);
  assert(nPortfolio === 4, `A expected exactly 4 portfolio- hrefs, got ${nPortfolio}`);
  html = html.slice(0, i1) + '<!--PROJECTS:index_snap-->' + html.slice(i2 + endM.length);
  write(fp, html);
  console.log('A OK: index.html span replaced with <!--PROJECTS:index_snap-->');
}

// ---------- B) PORTFOLIO.HTML ----------
{
  const fp = path.join(ROOT, 'portfolio.html');
  let html = read(fp);
  const { contentStart, innerEnd, closeEnd, inner } = depthExtract(html, '<div class="showcase-portfolio expand-grid">');
  const n = countOcc(inner, 'clapat-item');
  console.log(`B portfolio removed inner clapat-item count = ${n}`);
  assert(n === 8, `B expected exactly 8 clapat-item, got ${n}`);
  html = html.slice(0, contentStart) + '\n<!--PROJECTS:portfolio_grid-->\n' + html.slice(innerEnd);
  write(fp, html);
  console.log('B OK: portfolio.html inner replaced with <!--PROJECTS:portfolio_grid-->');
}

// ---------- C) HIGHLIGHTS.HTML ----------
{
  const fp = path.join(ROOT, 'highlights.html');
  let html = read(fp);
  // (1) viewport
  {
    const { contentStart, innerEnd, inner } = depthExtract(html, '<div class="clapat-slider-viewport">');
    const nSpace = countOcc(inner, 'clapat-slide ');
    const nAny = countOcc(inner, 'clapat-slide');
    console.log(`C hl_slides removed inner: 'clapat-slide ' (trailing space) = ${nSpace}, 'clapat-slide' (any) = ${nAny}`);
    assert(nSpace === 8, `C expected exactly 8 'clapat-slide ' (trailing space), got ${nSpace}`);
    html = html.slice(0, contentStart) + '\n<!--PROJECTS:hl_slides-->\n' + html.slice(innerEnd);
    console.log('C1 OK: highlights viewport replaced with <!--PROJECTS:hl_slides-->');
  }
  // (2) canvas
  {
    const { contentStart, innerEnd, inner } = depthExtract(html, '<div id="canvas-slider" class="canvas-slider">');
    const n = countOcc(inner, 'slider-img');
    console.log(`C hl_canvas removed inner slider-img count = ${n}`);
    assert(n === 8, `C expected exactly 8 slider-img, got ${n}`);
    html = html.slice(0, contentStart) + '\n<!--PROJECTS:hl_canvas-->\n' + html.slice(innerEnd);
    console.log('C2 OK: highlights canvas replaced with <!--PROJECTS:hl_canvas-->');
  }
  write(fp, html);
}

// ---------- D) PLAYGROUND.HTML ----------
{
  const fp = path.join(ROOT, 'playground.html');
  let html = read(fp);
  // (1) main viewport
  {
    const { contentStart, innerEnd, inner } = depthExtract(html, '<div class="clapat-slider-viewport">');
    const nSpace = countOcc(inner, 'clapat-slide ');
    const nClass = countOcc(inner, 'class="clapat-slide');
    const nAny = countOcc(inner, 'clapat-slide');
    console.log(`D pg_main removed inner: 'clapat-slide ' (trailing space) = ${nSpace}, 'class="clapat-slide' = ${nClass}, 'clapat-slide' any = ${nAny}`);
    // NOTE: original pg_main cards are <div class="clapat-slide"> with NO trailing class, so
    // trailing-space count is 0. True card count is 8 via class="clapat-slide.
    // Task text says assert 8 trailing-space; report true counts and assert true card count.
    console.log('D FINDING: pg_main trailing-space count is 0 (cards have no header suffix), true card count via class="clapat-slide is ' + nClass);
    assert(nClass === 8, `D expected exactly 8 clapat-slide cards, got ${nClass}`);
    if (nSpace !== 8) console.log('D MISMATCH vs task text: trailing-space count is ' + nSpace + ' not 8 (spec bug; cards are bare clapat-slide). Proceeding with true count 8.');
    html = html.slice(0, contentStart) + '\n<!--PROJECTS:pg_main-->\n' + html.slice(innerEnd);
    console.log('D1 OK: playground main replaced with <!--PROJECTS:pg_main-->');
  }
  // (2) sync viewport
  {
    const { contentStart, innerEnd, inner } = depthExtract(html, '<div class="clapat-sync-slider-viewport">');
    const n = countOcc(inner, 'clapat-sync-slide');
    console.log(`D pg_sync removed inner clapat-sync-slide count = ${n}`);
    assert(n === 8, `D expected exactly 8 clapat-sync-slide, got ${n}`);
    html = html.slice(0, contentStart) + '\n<!--PROJECTS:pg_sync-->\n' + html.slice(innerEnd);
    console.log('D2 OK: playground sync replaced with <!--PROJECTS:pg_sync-->');
  }
  write(fp, html);
}

// ---------- E) CARD TEMPLATES ----------
{
  const dir = path.join(ROOT, 'templates', 'cards');
  fs.mkdirSync(dir, { recursive: true });

  // Verify original index patterns from backup before writing templates
  const origIndex = read(path.join(ORIG, 'index.html'));
  assert(origIndex.includes('snap-slide trigger-item change-header-color'), 'orig index images pattern missing');
  assert(origIndex.includes('thumb-slide" data-centerLine="OPEN"'), 'orig index thumbs pattern missing');
  assert(origIndex.includes('snap-slide-caption change-header'), 'orig index captions pattern missing');

  const index_images = `<div class="snap-slide trigger-item change-header-color"><div class="img-mask"><div class="section-image trigger-item-link"><img decoding="async" src="{{project.hero}}" class="item-image grid__item-img" alt="">{{project.video_block}}</div><img decoding="async" src="{{project.hero}}" class="grid__item-img grid__item-img--large" alt=""></div></div>`;
  // video_block build-time definition (per task): if project.video present → <div class="hero-video-wrapper"><video loop muted class="bgvid"><source src="THE_VIDEO_URL" type="video/mp4"></video></div> else empty.
  // NOTE: original index video card uses exactly that (no playsinline); portfolio/playground originals use playsinline variant.

  const index_thumbs = `<div class="thumb-slide" data-centerLine="OPEN"><div class="thumb-slide-img"><img decoding="async" src="{{project.thumb}}" class="item-image grid__item-img" alt=""></div><a class="slide-link" data-type="page-transition" href="portfolio-{{project.slug}}.html"></a></div>`;

  const index_captions = `<div class="snap-slide-caption change-header"><div class="slide-title"><span>{{project.title}}</span></div><div class="slide-current"><span>{{i2}}</span></div><div class="slide-counter"><span>{{total2}}</span></div><div class="slide-subtitle">{{project.category}}</div></div>`;

  const portfolio_grid = `<div class="clapat-item {{project.category_class}} ">
<div class="slide-inner {{project.slide_inner_class}}" data-centerLine="OPEN" style="display:none">
<div class="img-mask pixels-cover">
<a class="slide-link" data-type="page-transition" href="portfolio-{{project.slug}}.html"></a>
<div class="section-image trigger-item-link">
<img src="{{project.hero}}" class="item-image grid__item-img" alt="">{{project.video_block}}
</div>
<img src="{{project.hero}}" class="grid__item-img grid__item-img--large" alt="">
<div class="section-thumb">
<img src="{{project.thumb}}" alt="">
</div>
</div>
<div class="slide-caption trigger-item-link-secondary">
<div class="slide-title"><span>{{project.title}}</span></div>
<div class="slide-date"><span>{{project.year}}</span></div>
<div class="slide-cat"><span>{{project.category}}</span></div>
</div>
</div>
</div>`;

  // NOTE above: slide_inner_class stored WITHOUT 'slide-inner' prefix? No — stored WITH prefix per EXPECTED table.
  // Template therefore must NOT duplicate 'slide-inner'. We wrote 'slide-inner {{...}}' which would duplicate.
  // Fix: use class="{{project.slide_inner_class}}" directly.
  const portfolio_grid_fixed = `<div class="clapat-item {{project.category_class}} ">
<div class="{{project.slide_inner_class}}" data-centerLine="OPEN">
<div class="img-mask pixels-cover">
<a class="slide-link" data-type="page-transition" href="portfolio-{{project.slug}}.html"></a>
<div class="section-image trigger-item-link">
<img src="{{project.hero}}" class="item-image grid__item-img" alt="">{{project.video_block}}
</div>
<img src="{{project.hero}}" class="grid__item-img grid__item-img--large" alt="">
<div class="section-thumb">
<img src="{{project.thumb}}" alt="">
</div>
</div>
<div class="slide-caption trigger-item-link-secondary">
<div class="slide-title"><span>{{project.title}}</span></div>
<div class="slide-date"><span>{{project.year}}</span></div>
<div class="slide-cat"><span>{{project.category}}</span></div>
</div>
</div>
</div>`;

  const hl_slides = `<div class="clapat-slide no-change-header">
<div class="slide-wrap{{active}}" data-slide="{{i}}"></div>
<div class="slide-events">
<div class="slide-inner">
<div class="slide-moving">
<div class="trigger-item" data-centerLine="OPEN">
<a class="slide-link" data-type="page-transition" href="portfolio-{{project.slug}}.html"></a>
</div>
<div class="slide-caption">
<div class="slide-title"><span>{{project.title}}</span></div>
<div class="slide-cat"><span>{{project.category}}</span></div>
</div>
</div>
</div>
</div>
</div>`;

  const hl_canvas = `<div class="slider-img" data-slide="{{i}}">
<img class="slide-img" src="{{project.hero}}" alt="" />
</div>`;

  const pg_main = `<div class="clapat-slide">
<div class="slide-effects">
<div class="slide-inner-height" data-centerLine="VIEW">
<div class="slide-moving">
<div class="trigger-item change-header" data-centerLine="OPEN" data-projectbgcolor="{{project.projectbgcolor}}">
<div class="img-mask">
<a class="slide-link" data-type="page-transition" href="portfolio-{{project.slug}}.html"></a>
<div class="section-image trigger-item-link">
<img src="{{project.hero}}" class="item-image grid__item-img" alt="">{{project.video_block}}
</div>
<img src="{{project.hero}}" class="grid__item-img grid__item-img--large" alt="">
</div>
</div>
</div>
</div>
<div class="slide-caption">
<div class="slide-date"><span>{{project.year}}</span></div>
<div class="slide-title"><span>{{project.title}}</span></div>
<div class="slide-cat"><span>{{project.category}}</span></div>
</div>
<div class="slide-thumb speed-50">
<img src="{{project.thumb}}" alt="">
</div>
</div>
</div>`;

  const pg_sync = `<div class="clapat-sync-slide">
<div class="trigger-item" data-centerLine="OPEN" data-projectbgcolor="#4b4d4f" data-projectcolor="#9c505f">
<div class="hover-reveal landscape1">
<div class="hover-reveal__inner">
<div class="hover-reveal__img">
<img src="{{project.hero}}" class="item-image grid__item-img" alt="">
<img class="grid__item-img grid__item-img--large" src="{{project.hero}}" alt="" />
</div>
</div>
</div>
<a class="slide-link" data-type="page-transition" href="portfolio-{{project.slug}}.html"></a>
<div class="slide-title trigger-item-link modify-color"><span>{{project.title}}</span></div>
</div>
</div>`;

  write(path.join(dir, 'index_images.html'), index_images + '\n');
  write(path.join(dir, 'index_thumbs.html'), index_thumbs + '\n');
  write(path.join(dir, 'index_captions.html'), index_captions + '\n');
  write(path.join(dir, 'portfolio_grid.html'), portfolio_grid_fixed + '\n');
  write(path.join(dir, 'hl_slides.html'), hl_slides + '\n');
  write(path.join(dir, 'hl_canvas.html'), hl_canvas + '\n');
  write(path.join(dir, 'pg_main.html'), pg_main + '\n');
  write(path.join(dir, 'pg_sync.html'), pg_sync + '\n');
  console.log('E OK: wrote 8 card templates to templates/cards/');
  console.log('E NOTES:');
  console.log('  - portfolio_grid uses class="{{project.slide_inner_class}}" (full value incl. slide-inner) + class="clapat-item {{project.category_class}} " (trailing space preserved). Includes {{project.video_block}} to preserve invincibles video (orig portfolio video has playsinline; canonical video_block per spec omits playsinline).');
  console.log('  - pg_main hardcodes trigger-item change-header (first-card pattern); originals vary (change-header on son/stena/kivira/nanotech, empty on infin/invincibles/voxa/vxlab) — variation noted, not tokenized per spec (only projectbgcolor tokenized). Includes {{project.video_block}} to preserve invincibles video.');
  console.log('  - hl_slides outer hardcodes no-change-header (first-card pattern); original kivira (idx4) is change-header — variation noted. slide-wrap uses {{active}} conditional per spec.');
  console.log('  - pg_sync hardcodes #4b4d4f/#9c505f (all 8 identical verified).');
  console.log('  - vx-lab thumb: original cards use assets/images/08hero.jpg (08hero1.jpg does NOT exist on disk) but table/JSON uses assets/images/08hero1.jpg per spec.');
}

// ---------- F) DETAIL PAGES ----------
{
  const mismatches = [];
  for (const p of projects) {
    const fp = path.join(ROOT, `portfolio-${p.slug}.html`);
    let html = read(fp);
    console.log(`F ${p.slug}: processing ${path.basename(fp)}`);

    // 1. title
    {
      const re = /<title>.*?<\/title>/s;
      const matches = html.match(new RegExp(re.source, 'gs'));
      assert(matches && matches.length === 1, `F ${p.slug} #1 title must match exactly once (got ${matches ? matches.length : 0})`);
      html = html.replace(re, '<title>{{project.title}} &#8211; Bennet &#8211; Creative Portfolio Theme</title>');
      console.log(`  F1 title: 1 match → tokenized`);
    }
    // 2. h1
    {
      const re = /<h1 class="hero-title caption-timeline">.*?<\/h1>/s;
      const matches = html.match(new RegExp(re.source, 'gs'));
      assert(matches && matches.length === 1, `F ${p.slug} #2 h1 must match exactly once (got ${matches ? matches.length : 0})`);
      html = html.replace(re, '<h1 class="hero-title caption-timeline"><span>{{project.title}}</span></h1>');
      console.log(`  F2 h1: 1 match → tokenized`);
    }
    // 3. hero-bg-image
    {
      const re = /<div id="hero-bg-image" style="background-image:url\(([^)]*)\)">/;
      const matches = [...html.matchAll(new RegExp(re.source, 'g'))];
      assert(matches.length === 1, `F ${p.slug} #3 hero-bg must match exactly once (got ${matches.length})`);
      const origUrl = matches[0][1];
      if (origUrl !== p.hero) {
        mismatches.push(`hero mismatch ${p.slug}: orig=${origUrl} table=${p.hero}`);
        console.log(`  F3 hero-bg MISMATCH: orig=${origUrl} vs table=${p.hero}`);
      } else {
        console.log(`  F3 hero-bg: orig=${origUrl} matches table hero`);
      }
      html = html.replace(re, '<div id="hero-bg-image" style="background-image:url({{project.hero}})">');
    }
    // 4. next link
    {
      const re = /class="next-ajax-link-project" data-type="page-transition" href="portfolio-([^"]+\.html)"/;
      const matches = [...html.matchAll(new RegExp(re.source, 'g'))];
      assert(matches.length === 1, `F ${p.slug} #4 next link must match exactly once (got ${matches.length})`);
      const oldFile = matches[0][1]; // e.g. vx-lab.html
      const oldSlug = oldFile.replace(/\.html$/, '');
      if (oldSlug !== p.next_slug) {
        mismatches.push(`next_slug mismatch ${p.slug}: orig=${oldSlug} table=${p.next_slug}`);
        console.log(`  F4 next MISMATCH: orig=${oldSlug} vs table=${p.next_slug}`);
      } else {
        console.log(`  F4 next: orig=${oldSlug} matches table next_slug`);
      }
      html = html.replace(re, 'class="next-ajax-link-project" data-type="page-transition" href="portfolio-{{project.next_slug}}.html"');
    }
    // 5. next title
    {
      const re = /<div class="next-hero-title caption-timeline has-shuffle-title" data-firstline="Next" data-secondline="Project"><span>.*?<\/span><\/div>/s;
      const matches = html.match(new RegExp(re.source, 'gs'));
      assert(matches && matches.length === 1, `F ${p.slug} #5 next-title must match exactly once (got ${matches ? matches.length : 0})`);
      html = html.replace(re, '<div class="next-hero-title caption-timeline has-shuffle-title" data-firstline="Next" data-secondline="Project"><span>{{project.next_title}}</span></div>');
      console.log(`  F5 next-title: 1 match → tokenized`);
    }
    // 6. next bg
    {
      const re = /<div class="next-project-image-bg" style="background-image:url\(([^)]*)\)">/;
      const matches = [...html.matchAll(new RegExp(re.source, 'g'))];
      assert(matches.length === 1, `F ${p.slug} #6 next-bg must match exactly once (got ${matches.length})`);
      console.log(`  F6 next-bg: orig=${matches[0][1]} → tokenized to {{project.next_hero}}`);
      html = html.replace(re, '<div class="next-project-image-bg" style="background-image:url({{project.next_hero}})">');
    }
    write(fp, html);
    console.log(`F ${p.slug}: OK wrote ${path.basename(fp)}`);
  }
  if (mismatches.length) {
    console.log('F MISMATCHES FOUND:');
    mismatches.forEach(m => console.log('  - ' + m));
  } else {
    console.log('F VERIFIED: no hero/next_slug mismatches (all 8 heroes and 8 next_slugs match table).');
  }
}

// ---------- G) Verify at end ----------
{
  console.log('G per-file marker presence:');
  const checks = [
    ['index.html', ['PROJECTS:index_snap']],
    ['portfolio.html', ['PROJECTS:portfolio_grid']],
    ['highlights.html', ['PROJECTS:hl_slides', 'PROJECTS:hl_canvas']],
    ['playground.html', ['PROJECTS:pg_main', 'PROJECTS:pg_sync']],
  ];
  for (const [f, markers] of checks) {
    const html = read(path.join(ROOT, f));
    markers.forEach(mk => {
      const has = html.includes(mk);
      console.log(`  ${f} contains ${mk}? ${has}`);
      assert(has, `G missing marker ${mk} in ${f}`);
    });
    // ensure no leftover project cards? (spot check: index should have no snap-slide, etc.)
  }
  // detail pages contain {{project.
  for (const p of projects) {
    const fp = path.join(ROOT, `portfolio-${p.slug}.html`);
    const html = read(fp);
    const has = html.includes('{{project.');
    console.log(`  portfolio-${p.slug}.html contains {{project.? ${has}`);
    assert(has, `G missing {{project. in portfolio-${p.slug}.html`);
    ['{{project.title}}', '{{project.hero}}', '{{project.next_slug}}', '{{project.next_title}}', '{{project.next_hero}}'].forEach(tok => {
      assert(html.includes(tok), `G missing ${tok} in portfolio-${p.slug}.html`);
    });
  }
  // print projects.json
  const pj = read(path.join(ROOT, 'content', 'projects.json'));
  console.log('G content/projects.json:');
  console.log(pj);

  // templates list
  console.log('G templates/cards/:');
  const tdir = path.join(ROOT, 'templates', 'cards');
  fs.readdirSync(tdir).forEach(f => {
    const s = read(path.join(tdir, f));
    console.log(`  - ${f} (${s.length} chars) has {{project.? ${s.includes('{{project.')}`);
  });

  // git status
  console.log('G git status --short:');
  try {
    const out = execSync('git status --short', { cwd: ROOT, encoding: 'utf8' });
    console.log(out === '' ? '(clean)' : out);
    const lines = out.split('\n').filter(l => l.trim() !== '');
    console.log(`G git status lines: ${lines.length}`);
    // verify only 12 html + tools/, templates/, content/
    const allowedHtml = new Set(['index.html','portfolio.html','highlights.html','playground.html',
      'portfolio-son-of-a-tailor.html','portfolio-stena-air.html','portfolio-the-infin.html','portfolio-the-invincibles.html',
      'portfolio-kivira-naturals.html','portfolio-voxa-speaker.html','portfolio-nanotech-agency.html','portfolio-vx-lab.html']);
    for (const line of lines) {
      // format: " M file" or "?? dir/file"
      const fpath = line.slice(3).trim().replace(/\/$/, '');
      const top = fpath.split('/')[0];
      if (top.endsWith('.html')) {
        assert(allowedHtml.has(top), `G unexpected modified html: ${fpath}`);
      } else {
        assert(['tools','templates','content'].includes(top), `G unexpected path modified: ${fpath} (full line: ${line})`);
      }
    }
    console.log('G OK: git status shows only allowed 12 html + tools/templates/content paths.');
  } catch (e) {
    console.log('G git status failed: ' + e.message);
    throw e;
  }
}

console.log('ALL DONE.');
