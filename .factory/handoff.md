# Couch Crew review handoff

## Review 1 — FAIL

Review `couch-crew-review-1` checked implementation `04a1383` and documentation
head `d74f520` against <https://couch-crew.sociobot.in> on 2026-09-05. It found
one medium defect, so this product is **not accepted by this review**. The real
HTTP 404 page is deliberately served with status 404 and has a recovery link,
but its static header/footer links are smaller than 44×44 px on a 390 px phone
and its footer misses Privacy, Built by Param Factory, and version/build text.
See `.factory/review-1.md` for exact measurements and the repair needed.

All 19 declared claim commands, the clean full `npm test`, lint, typecheck,
audit, and build passed. Fresh live desktop and phone checks confirmed the
first-screen game, demo sandbox, terminal win/loss/replay, independent phone
controller, offline reload, origin checks, and rate limits. Local static files
match the live deployment; the realtime health build remains `e2d48b7`, the
code-bearing ancestor of the static candidate. No product code was changed by
this review.

## How to verify the remaining defect

```sh
npm ci
npm test
npm run build
```

After a repair is deployed, inspect an unknown route at 390 px. Every visible
404 link must be at least 44×44 px, and its footer must contain the same
required product, Privacy, Terms, Param Factory, and version/build information
as other routes.

## Earlier repair handoff

## Independent verification — PASS

Candidate `0d27a4dcc8aa26cae50df8c5629046f03f73c2ae` was independently accepted
on 2026-09-02 against <https://couch-crew.sociobot.in>. Fresh clean-install
claims, lint, typecheck, full test suite, and production build passed. The
deployed HTML, hashed JS, and CSS match this candidate byte-for-byte. See
`.factory/verification-4.md` for exact functional, accessibility, privacy,
offline, mobile, WebSocket-origin, and rate-limit evidence. No known gaps or
release-blocking defects remain.

## Release result

**PASS — repaired, pushed, and deployed on September 2, 2026.**

Final product source commit: `04a1383201c70810f4fe3e54d4d473c42869fd4c`. Static production is <https://couch-crew.sociobot.in>. The product-owned room service is unchanged by the final copy-only commit and runs revision `sf-couch-crew-realtime--0000004` from repair image `ca45e8529f09acr.azurecr.io/sf-couch-crew-realtime:e2d48b7435ba` (digest `sha256:b0961832adba97fa40f344647091591c39abf0cdaf2fd0a50845b3b588084316`). Its live health response reports `e2d48b7435badb3b64b6daabc540da3d2550a1e4`.

## Failure reproduction

The unchanged report commit `f1958f81ab6133d33164f4b1088c803ae297ce32` was tested before edits. Its ordinary full run passed once, confirming the reported intermittence. Running the same two-worker browser suite on one CPU reproduced the release blocker at 15/16 tests: `@claim:rendered-frame-rate` measured 46.976 fps against the unchanged 50 fps floor. The failure used the same test and artifact path documented by the verifier.

## Repairs

- Kept functional Playwright coverage at two workers and moved only the real frame measurement to a one-worker configuration. The test warms the live loop, records five 60-frame samples, takes their median, and still requires 50–65 fps.
- Added real run pacing. Correct input locks immediately, pressure stops rising for that locked move, and the next call releases on a 17.5-second cadence. Forty-eight moves therefore take at least 14 minutes. A completed deterministic run using 19-second responses plus 50-second mission briefings measures 1,062 seconds (17:42).
- Put “For 3–6 friends or family members in one room” and the exact “Try it with sample data” action in the first screen.
- Expanded the crew-size regression through 3, 4, 5, and 6 players and all five role assignments.
- Registered and tested the production/local WebSocket origin allowlist, exact 8-opening and 60-health-check per-client limits, deletion of recovery state after both win and loss, and absence of chat.
- Restored `tabindex="-1"` on the home h1 and verified SPA navigation moves focus there.
- Raised header, footer, and inline controller links to 44×44 CSS px. The 390 px regression now measures every visible link, button, select, text input, and checkbox label on all application routes.
- Bumped the service-worker cache and added an update-before-offline assertion.
- Added ESLint, an explicit TypeScript gate, and a manifest check requiring exactly one tagged test for every registered claim.
- Removed a race in the phone-controller test by waiting for the server-created room URL before joining.

## Local verification

Clean release run:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Results:

- Clean install: 174 packages; zero audit findings.
- Lint and TypeScript: pass.
- Unit: 8/8; room service: 3/3; deployment policy: 3/3.
- Functional browser suite: 19/19 with two workers.
- Isolated frame test: 1/1; samples 60.00, 60.01, 60.00, 60.00, 60.01 fps; median 60.00 fps.
- The complete `npm test` run also passed while pinned to one CPU. Its frame samples were 60.01, 60.00, 60.00, 60.00, and 58.04 fps; median 60.00 fps.
- Production build: JS 26.80 kB (9.29 kB gzip), CSS 18.79 kB (5.00 kB gzip).
- Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 953 ms, LCP 1,655 ms, TBT 27 ms, CLS 0.0073, transfer 120,864 bytes.
- Factory `verify-url.sh` locally: HTTP 200 in 612 ms, title and `lang=en`, one h1, one main, zero missing alt text, zero unlabeled buttons, and zero console/page errors. Desktop and 390 px screenshots were visually reviewed.

All 19 entries in `.factory/claims.json` have exactly one tagged regression. The claim suite proves the real win and replay flows, minimum and representative session timing, assist mode, touch/keyboard input, every crew size, phone roles, persistence, demo isolation, both privacy modes, offline update/reload, free/no-account behavior, fixed simulation rate, rendered frame rate, origin policy, exact rate limits, terminal save deletion, and no chat.

## Live verification

- Factory `verify-url.sh`: HTTP 200 in 674 ms with zero console/page errors; title, language, h1, main, alt text, and button-name checks pass.
- Live browser subset: 11/11 passed serially against production, covering a complete run, touch/keyboard, phone controller, both request policies, offline update/reload, axe on all five routes, all 390 px targets, home focus, first-screen copy, and dialog focus/inert behavior.
- Live frame samples at 390 px: 60.00, 60.00, 60.00, 60.00, 60.00 fps; median 60.00 fps.
- Live Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 912 ms, LCP 1,512 ms, TBT 32 ms, CLS 0.0069, transfer 120,664 bytes.
- `/`, `/demo`, `/controller`, `/privacy`, `/terms`, `robots.txt`, and `sitemap.xml` return 200. An unknown route returns the designed page with HTTP 404.
- Live headers include CSP with the product room service allowlisted and `frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, permissions policy, and 30-second HTML revalidation.
- The deployed JavaScript SHA-256 equals the local build: `5c53a641b86dbe39e3167142cf2d55e68da83e10f87039e0d2d18397d28bb0f1`.
- Room-service health returns `buildId: e2d48b7435badb3b64b6daabc540da3d2550a1e4`; its active custom hostname is SNI-bound. A hostile live WebSocket origin returns 403.

## Deployment note

The room app uses its existing dedicated environment and registry. The generic container helper successfully rolled out the prebuilt revision but assumed the fleet-wide certificate environment, so the existing `sf-couch-crew-realtime.sociobot.in` certificate was rebound through `sf-couch-crew-realtime-env`. Temporary helper-created DNS records for the unused hostname were removed. No unrelated resource, application setting, secret, storage, staging slot, shared database, or infrastructure was read or changed.

## Known gaps

None.
