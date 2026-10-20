# CLAUDE.md – Zúrich en Navidad

Personal, Spanish-language city guide by Mike (Zürich, works at Pfingstweidstrasse 51) for two
Spanish colleagues visiting **20–27 Nov 2026**. Mobile first. Live: https://mikefaehch.github.io/zuerich/
Mike writes to you in German; everything visitors see is **Spanish (Spain, «vosotros»)**.

## Files (static site, no build, no framework)
| File | What | Read it when… |
|---|---|---|
| `data.js` | ALL content: `TRIP`, `CATS`, `CONFIG`, `OFFICE`, `SZU_NOTE`, `PLACES` (57), `IDEAS` (13) | adding/editing places, tips, hours, ideas, favourites |
| `app.js` | all logic (render, filters, map, plan, deep links) | changing behaviour |
| `style.css` | design tokens in `:root` (+ dark mode) and components | changing looks |
| `index.html` | markup, meta/OG tags, CSP | changing page structure or static FAQ text |
| `sw.js` | offline cache (network first, same-origin only) | adding a file that must work offline |
| `tests/check.py` | the only test command | always run before committing |
| `img/` | WebP photos (`name-400.webp` thumb, `name-800.webp` tile), hero, OG image | adding photos |
| `vendor/` | fonts (Cormorant Garamond, Inter) + Leaflet 1.9 + markercluster – never edit | – |

## Workflow (every change)
1. Understand: read this file + only the file you need.
2. Change: content → `data.js` only. Keep diffs small.
3. Test: `python3 tests/check.py` (≈1–2 min, needs Playwright/Chromium; `-v` lists all checks). Must end with `N/N checks passed`.
4. Look: for visual changes take a 390×844 screenshot (Playwright) and look at it.
5. Commit with a German message saying what changed for the visitor; push to `main` (= live in ~1 min).
Rollback: `git revert <sha>`.

## Data model (`PLACES`, one record = one place; see comment block in data.js)
- Required: `id` (`[a-z0-9-]`, used in links `#p-id` – never rename), `name`, `cat` (key of `CATS`),
  `prio` `'top'|'muy'|'si'`, `desc`, `ll` [lat, lon], `q` (Google Maps search), `dur`, `ov`, `hours`, `price`, `status`.
- `status`: `'ok'` official source checked · `'sec'` secondary source → shows «Confirmar antes de ir» · `'pend'` unknown.
  Always set `src` (URL of the source) and update `TRIP.checked` when re-verifying.
- `close` [Sun..Sat] closing hour (null = closed) – drives the «cierra a las 17 h» hint in the plan.
- Christmas items (`cat:'navidad'`) need `open:['YYYY-MM-DD','YYYY-MM-DD']` + `closed:[]` (calendar) or `status:'pend'`.
- `tags`: `cafe`, `almuerzo`, `cena`, `bar` (sub-filters of «Comer y café»).
- `poc:true` = **favourite of Mike (gold star)**. Mike decides the list (currently 13). `rec:true` = «Recomendado por Mike» (no star).
- `tip` = «Consejo de Mike». **Only Mike's own words**, translated to Spanish. Never invent first-person text.
- List cards never show images (text only); photos appear in hero, momentos tiles and favourite picks. `img:'img/name'` requires `img/name-400.webp` + `img/name-800.webp`, `imgCap`, `credit`.
- `IDEAS`: `id` (links `#idea-id`), `title`, `dur`, `days`, `text`, `note`, `stops` (place ids, in walking order), `walkOnly`/`transit`.
- Front page «Lo mejor de Zúrich» = Mike's favourites: `CONFIG.favFirst` = photo picks in order (must have `img`, quote = 1st sentence of `tip`);
  all other `poc` places appear automatically in «Más favoritos».
- «Según el momento del día» (4 tiles above the favourites) = `CONFIG.momentos`: `manana` uses its fixed `places` list (cafés open from 8 h),
  `mediodia`/`tarde`/`finde` use rules in `inTab()` (`m-…` tabs) – lunch is sorted by distance to `OFFICE`. `CONFIG.topIdeas` (3 visible ideas), `CONFIG.mapFar`.
- `tags` also `brunch`. Card label comes from `kindLabel()` (Café / Brunch y café / Bar / Restaurante) + barrio from the postcode in `addr`.

### Add a restaurant (example)
Copy a `gastro` record in `data.js`, new unique `id`, verified hours + `src`, `tags`, `close`, `rec:true` if Mike
recommended it, `tip` only if Mike said why. Run the tests. Nothing else to touch.

## Content rules (from Mike)
- No invented facts. Seasonal offers (markets, events) only with checked dates; otherwise `status:'pend'`.
- No fixed day-by-day programme. Visitors plan themselves in «Mi plan».
- Keep the S10/S4 construction note (`SZU_NOTE`, no departures from Zürich HB until 12.12.2026) visible.
- Never the word «POC» in visible text. Star colour `#C49A48`.
- Photos: only if the location is certain (several Unsplash photos show Lucerne/Kraków/Tallinn/Warsaw – never as Zürich).
  Keep photographer credit. Grade: restrained, natural; WebP ~q76–78.
- Ask Mike before removing larger content blocks.

## Core features that must keep working (all covered by tests/check.py)
Nav (Descubrir · Ideas · Mi plan) sticky · filters + sub-filters · «Oficina»/«Cerca de mí» sorting · cards with
«Más información» · lazy Leaflet map with clusters + office marker · Mi plan (add, drag, arrow keys, remove,
localStorage `zh-plan3`, migration from `zh-plan`/`zh-favs`) · Google Maps route (max 10 stops) · WhatsApp share ·
shared plan links `#plan=id~id` (also old `id.N` / `i-idea`) · deep links `#p-id`, `#idea-id`, old anchors in `ALIAS`
· dark mode · offline (sw.js).

## Pitfalls (learned the hard way)
- Do **not** put `overflow-x:hidden` on `body` – it breaks the sticky nav (html already has `overflow-x:clip`).
- Never pass `location.hash` to `querySelector`; use `getElementById` (odd links used to crash the page).
- `.more` uses the `hidden` attribute; any `display:` rule needs `[hidden]{display:none}` (exists globally).
- All of `<main>` is hidden until `html.ready` (no layout shift) – keep `classList.add('ready')` after rendering.
- CSP is a `<meta>` in index.html: new external hosts (images, fetch) must be added there; the inline
  `<script>` in `<head>` is allowed by its sha256 hash – if you change that line, update the hash.
- `sw.js`: bump `CACHE` only when the `CORE` list changes (network-first serves fresh files anyway).
- GitHub Pages: no custom headers, no server code. Everything must stay static.
- Drag & drop listens on `window` (moving the node breaks pointer capture) – don't "simplify" that.
- Google Drive images > ~6 MB crash the Drive connector: ask Mike to upload them in chat instead.
