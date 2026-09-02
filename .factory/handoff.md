# Couch Crew handoff

## Built

- Shipped a Vite + TypeScript browser game with a deterministic 60 Hz core.
- Built one complete run from setup through three missions, win or loss, summary, and replay.
- Added five asymmetric roles with ten labeled touch controls and keys `1`–`0`.
- Added 3–6 player role assignment, a sixth-player dispatcher wildcard, pause, sound, screen-nudge control, and calm-pressure assist.
- Added local recovery for unfinished real runs plus saved settings and aggregate results.
- Added `/demo` with a deterministic sample already in play, reset, and exit actions. Demo game data stays in memory.
- Added `/privacy`, `/terms`, SPA 404 handling, a designed static `404.html`, metadata, social art, sitemap, robots file, security headers, and cache rules.
- Added an offline service worker that precaches the generated Vite assets and game shell.
- Generated and reviewed an original pixel-art night-road scene. Responsive WebP files are 35 KB and 102 KB; the social crop is 87 KB.
- Added a plain-language copy audit, claim registry, deterministic unit tests, and Playwright browser tests.

## Verify

Run from a clean checkout:

```sh
npm install
npm test
npm run build
```

Verified on September 2, 2026:

- `npm test`: 6 unit tests and 11 Chromium tests passed.
- `npm run build`: passed; `dist/index.html` exists.
- Production JS: 22.20 KB raw, 7.90 KB gzip.
- Production CSS: 15.09 KB raw, 4.30 KB gzip.
- Mobile hero WebP: 35 KB.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- Lighthouse: LCP 1.4 s, CLS 0, total blocking time 80 ms, first contentful paint 1.0 s.
- 390 × 844 headless Chromium: no horizontal overflow; all role controls visible.
- Two-second 390 px render sample: 120 frames, 59.99 fps.
- Factory `verify-url.sh`: HTTP 200, one title, `lang=en`, one `<h1>`, main landmark, no missing alt text, no unlabeled buttons, and no console errors.
- Playwright axe integration: no serious or critical violations on home, demo, privacy, or terms.
- `npm audit --audit-level=moderate`: zero vulnerabilities.

## Known gap

The researched brief asks each phone to act as its own controller. This static work order cannot provide the product-owned signalling service required for safe multi-device rooms. V1 therefore delivers the full cooperative campaign on one shared touch screen or keyboard and says so on the landing page and README. It does not pretend the displayed local room code connects phones.

The next step is a product-owned WebSocket signalling service, short-lived anonymous room state, and phone-specific controller routes. That requires changing the deployment from static-only to a container-backed product.

## Deployment

Deploy the exact output of `npm run build` from `dist/`. No environment variables, database, external service, payment setup, DNS change, or infrastructure mutation is required.
