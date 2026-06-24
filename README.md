# Eeja Agency — Bennet Theme (Exact Clone)

A pixel-perfect local clone of the **ClaPat Bennet — Creative Portfolio Theme** (http://bennet.clapat-themes.com/). All CSS, JS, fonts, images, and videos are downloaded verbatim from the official theme and served locally — **zero external links to the original site**.

## Source
Original theme: http://bennet.clapat-themes.com/ (used only for content reference during initial build)

## Pages (17 total)

### Main pages (9)
1. `index.html` — Home (hero, landing intro, video + description, snap slider, pinned list, contact icons)
2. `agency.html` — Studio (parallax list, team list, pinned list, awards flex-list)
3. `contact.html` — Contact (Google Maps canvas, contact form, icon boxes)
4. `highlights.html` — WebGL featured projects slider (Three.js displacement)
5. `portfolio.html` — All projects with filter (8 projects)
6. `playground.html` — Archive (Three.js hover-reveal gallery)
7. `typography.html` — Resources / Typography elements
8. `multimedia.html` — Multimedia carousel
9. `404.html` — Not found page

### Portfolio detail pages (8) — circular chain
10. `portfolio-son-of-a-tailor.html`
11. `portfolio-stena-air.html`
12. `portfolio-the-infin.html`
13. `portfolio-the-invincibles.html`
14. `portfolio-kivira-naturals.html`
15. `portfolio-voxa-speaker.html`
16. `portfolio-nanotech-agency.html`
17. `portfolio-vx-lab.html`

## Stack
- **HTML5 / CSS3 / jQuery** — exact structure from the official Bennet theme
- **Official Bennet CSS** (downloaded verbatim, MD5-verified against live site)
- **Elementor per-page post CSS** (post-6, 3159, 3167, 3169, 3171, 3173, 3142) — provides column widths via `--width: 75% / 25%`
- **GSAP 3.x** + **ScrollTrigger** + **Flip** — Bennet animations (all re-enabled)
- **Three.js** — WebGL grid-to-fullscreen + hover-reveal
- **jQuery** + **FlexNav** + **justifiedGallery** — Bennet UI
- **smooth-scrollbar** — Bennet smooth scroll
- **FontAwesome 6** — Bennet icons
- **Google Fonts**: Poppins (400, 500, 600) + Playfair Display (400-900) — exact Bennet fonts

## Bennet Brand
- **Primary color**: `#8c6144` (Bennet signature brown/copper)
- **Default background**: `#c8c8c8` (light section)
- **Dark content**: `#000000` / `#0c0c0c`
- **Text**: `#777` (body) / `#000` (headings) / `#fff` (on dark)

## Local development

```bash
cd "/Users/kedarstudios/Documents/Eeja Agency"
python3 -m http.server 8000
# Open http://localhost:8000
```

## Asset verification
All assets MD5-checked against the official live site. Key files:
- `assets/css/bennet-*.css` (9 files) — official Bennet theme CSS, MD5-verified
- `assets/css/bundle.css` — master loader (imports all CSS in official order)
- `assets/css/elementor/` — Elementor widget CSS + per-page post CSS
- `assets/js/bennet-*.js` (4 files) — official Bennet scripts
- `assets/js/lib/` — 3rd party libs (jQuery, GSAP, Three.js, etc.) — official
- `assets/images/` — 56 JPGs (hero, team, parallax, project galleries, etc.)
- `assets/images/displacement/aqua-light.jpg` — WebGL displacement texture
- `assets/images/shortcodes/` — typography floating images
- `assets/webfonts/` — FontAwesome 6 webfonts (.woff2 + .ttf)

## Asset structure

```
Eeja Agency/
├── 404.html
├── index.html
├── agency.html
├── contact.html
├── highlights.html
├── portfolio.html
├── playground.html
├── typography.html
├── multimedia.html                          # NEW
├── portfolio-son-of-a-tailor.html           # NEW
├── portfolio-stena-air.html                  # NEW
├── portfolio-the-infin.html                  # NEW
├── portfolio-the-invincibles.html            # NEW
├── portfolio-kivira-naturals.html            # NEW
├── portfolio-voxa-speaker.html               # NEW
├── portfolio-nanotech-agency.html            # NEW
├── portfolio-vx-lab.html                     # NEW
├── README.md
└── assets/
    ├── css/
    │   ├── bundle.css                        # Master loader
    │   ├── bennet-content.css                # Official (MD5-verified)
    │   ├── bennet-showcase.css               # Official
    │   ├── bennet-portfolio.css              # Official
    │   ├── bennet-blog.css                   # Official
    │   ├── bennet-shortcodes.css             # Official
    │   ├── bennet-assets.css                 # Official
    │   ├── bennet-style-wp.css               # Official
    │   ├── bennet-page-builders.css          # Official
    │   ├── bennet-style.css                  # Official main theme (MD5-verified)
    │   ├── fontawesome.css                   # Official FontAwesome 6
    │   ├── fonts.css                         # Google Fonts
    │   └── elementor/
    │       ├── frontend.min.css              # Elementor core
    │       ├── elementor-post-6.css          # Global elementor
    │       ├── widget-heading.min.css        # Headings widget
    │       ├── widget-icon-box.min.css       # Icon box widget (NEW)
    │       ├── widget-icon-list.min.css      # Icon list widget (NEW)
    │       ├── widget-spacer.min.css         # Spacer widget
    │       ├── elementor-post-3159.css       # Home (NEW)
    │       ├── elementor-post-3167.css       # Agency (NEW)
    │       ├── elementor-post-3169.css       # Contact (NEW)
    │       ├── elementor-post-3171.css       # Typography (NEW)
    │       ├── elementor-post-3173.css       # Multimedia (NEW)
    │       └── elementor-post-3142.css       # Son of a Tailor detail (NEW)
    ├── js/
    │   ├── bennet-common.js
    │   ├── bennet-scripts.js
    │   ├── bennet-clapat.js
    │   └── bennet-contact.js
    ├── js/lib/                               # 3rd party libs (no bennet-*.js dupes)
    │   ├── jquery.min.js, modernizr.js, etc.
    │   ├── clapat.min.js
    │   ├── gsap.min.js, scrolltrigger.min.js, flip.min.js
    │   ├── three.min.js
    │   └── ...
    ├── webfonts/                             # FontAwesome 6 fonts
    └── images/
        ├── 01-08hero.jpg, 01-08hero1.jpg    # All hero images
        ├── 04hero.mp4, intro.mp4            # Videos
        ├── logo.png, logo-white.png          # Logo
        ├── eyes.png, eyes1.png               # Cursor images
        ├── marker.png                        # Map marker
        ├── parallax.jpg                      # Parallax section
        ├── team1-6.jpg                       # Team photos
        ├── shortcodes/                       # Typography floating images
        │   ├── image01.jpg
        │   └── pinned01.jpg
        ├── displacement/                     # WebGL pattern
        │   └── aqua-light.jpg
        ├── son01-06.jpg, stena01-06.jpg, etc. # Per-project galleries
        └── 01-07hero1.jpg (06, 07 added later)
```

## Verification commands

```bash
# Should be ZERO references in HTML/JS files
grep -rn "bennet\.clapat-themes\.com" --include="*.html" --include="*.js" .
grep -rn "clapat-themes\.com" --include="*.html" --include="*.js" .
grep -rn "clapat\.ro" --include="*.html" --include="*.js" .

# Should be ZERO missing assets
for f in *.html; do
  grep -oE '(src|href|data-bg-image|data-img)="assets/[^"]+"' "$f" | sed -E 's/.*"(assets\/[^"]+)".*/\1/' | sort -u | while read asset; do
    [ -f "$asset" ] || echo "MISSING: $f references $asset"
  done
done
```

## Changelog

- **v1.0** — Initial clone with custom override.css + clone-custom.js (deprecated)
- **v2.0** — Replaced override layer with verbatim official CSS/JS (MD5-verified)
- **v3.0** — Removed all external links to bennet.clapat-themes.com (RSS, JSON, oEmbed, RSD, api.w.org, jquery scripts)
- **v3.1** — Created 8 portfolio detail + 1 multimedia page (now 17 total)
- **v3.2** — Stripped social media link wrappers, removed ClaPat copyright link
- **v3.3** — Added elementor widget-icon-box, widget-icon-list, per-page post CSS
- **v3.4** — Fixed WebGL pattern-img path (`displacement/aqua-light.jpg`)
- **v3.5** — Fixed body class order, footer/header links, navigation chains
- **v3.6** — Cleaned up duplicate files (CSS, JS, empty dirs)
- **v3.7** — Fixed all broken internal hrefs in 17 HTML pages (`<path>/` → `<path>.html`, `bennet_portfolio/<slug>/` → `portfolio-<slug>.html`, removed broken `shortcodes/` page-nav in multimedia)
- **v3.8** — Comprehensive live-site audit and 100% match:
  - Phase 1: Restored `multimedia.html` page-nav block (5 missing classes: `page-nav-wrap`, `next-ajax-link-page`, `next-hero-title`, `move-nav-onload`, `page-nav-caption`) with `href="index.html"`. Div count now 197 (matches live).
  - Phase 2: MD5-verified all 49 critical assets (28 hero/team/logos + 21 detail-page images) against live site — 100% match.
  - Phase 3: Re-fetched all 18 live HTMLs, found only session-specific Elementor nonces differ (`bc1bef8cb4` → `9611aa4609`); no content drift.
  - Phase 4: Visual screenshot diff of all 17 pages. Found and fixed 6 critical `data-bgcolor` bugs on detail pages where the build script hardcoded `#c8c8c8`:
    - `portfolio-stena-air.html`: `#c8c8c8` → `#b8b6a7` (cream/beige)
    - `portfolio-the-infin.html`: `#c8c8c8` → `#0c0c0c` (black)
    - `portfolio-the-invincibles.html`: `#c8c8c8` → `#192327` (dark teal)
    - `portfolio-kivira-naturals.html`: `#c8c8c8` → `#f0efeb` (cream)
    - `portfolio-voxa-speaker.html`: `#c8c8c8` → `#0c0c0c` (black)
    - `portfolio-vx-lab.html`: `#c8c8c8` → `#4b4d4f` (grey)
  - Phase 5: Final audit: 0 references to original site in HTML/JS, 1 reference in CSS file (theme metadata — required for 100% match), 0 broken internal hrefs, 0 missing assets.
