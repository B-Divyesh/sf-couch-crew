# Couch Crew repair handoff

## Release result

**PASS — repaired and deployed.**

The repaired static product source is commit `38810907d24b5c31e1f67e1732ea546725f95992` (`fix: harden realtime and deterministic replay`). A server-only follow-up, `7f9637ae39bd54a36dee559cc174518d5436f773`, keys rate limits to the proxy-nearest client address. Static production is deployed at <https://couch-crew.sociobot.in>. The product-owned realtime image is `ca45e8529f09acr.azurecr.io/sf-couch-crew-realtime:7f9637a` (digest `sha256:c90d213989e38b1fbea3c380ff1de4c3441bcba498171c981947550f044dc6dd`) and its live health response reports that exact follow-up commit.

## Repairs

- Replaced the timeout-prone sequential browser click loops with deterministic scripted UI playthroughs. Full parallel `npm test` now proves the real win screen, replay reset, and all three missions without the prior 30-second failures.
- Added an explicit realtime allowance: 60 health checks and 8 WebSocket handshakes per client per minute, keyed to the proxy-nearest client address. Excess traffic receives `429 Too Many Requests` and a positive `Retry-After`; browser upgrades accept only Couch Crew or local-development origins.
- Upgraded runtime `ws` from 8.18.1 to 8.21.3. `npm audit --omit=dev` reports zero vulnerabilities.
- Added immutable `buildId` to realtime health and passed the repair commit through the image build and Container App environment.
- Made briefing, pause, win, and loss overlays modal dialogs. Focus enters the dialog, all obscured page controls are inert, and pause resume returns focus to the invoking control.
- Expanded claims for real-mode request privacy and measured 390 px rendering rate. The unfinished-run persistence test now advances, reloads, and asserts recovered route state.
- Removed duplicate How it works landmarks and IDs, brought the undersized controls to 44 px, added `/controller` to the sitemap, refreshed the copy audit, and configured exact SPA rewrites so unknown paths return a true 404.

## Verification evidence

Local clean install and quality gates:

```sh
npm ci
npm test
npm run build
npm audit --omit=dev
```

Results: 7 Vitest core tests, 1 realtime policy/identity test, 2 deployment-policy tests, and 16 Playwright tests passed under the committed two-worker configuration. The production build completed with 25.81 kB JS (8.95 kB gzip) and 18.47 kB CSS (4.93 kB gzip). Audit reported zero vulnerabilities.

Claims are registered in `.factory/claims.json`; the full test run includes every tagged claim. In particular, `@claim:complete-run` reaches the actual “The crew cleared the route” result after 48 moves, and `@claim:restart-reset` loses, restarts to `4 / 12`, then wins again.

Live checks on 2026-09-02:

- `verify-url.sh https://couch-crew.sociobot.in <evidence-dir>`: HTTP 200, title, `lang=en`, one h1, main landmark, zero missing image alt text, zero console/page errors; desktop and 390 px screenshots captured.
- Live Playwright axe integration: all five public application views had zero serious/critical violations; the duplicate landmark issue is gone.
- Live `/demo` browser checks: complete run, restart, service-worker offline reload, 390 px layout, and overlay focus/inert behavior passed (5/5).
- `https://couch-crew.sociobot.in/definitely-missing-qa` returned HTTP 404 and the designed 404 document.
- Fresh local and live static JavaScript SHA-256 matched: `1fe32dd600351f76ee3de725fbaae7a9977de0b32a0386eb5ccb4ef0cbe7c590`.
- Live realtime health returned `{"service":"couch-crew-realtime","rooms":0,"buildId":"7f9637ae39bd54a36dee559cc174518d5436f773"}`.
- Live probes reached the enforced policy: health returned 429 with `Retry-After: 14`; a hostile WebSocket Origin returned 403; a permitted origin exceeded its allowance and received 429 with `Retry-After: 31`.

The standalone `@axe-core/cli` launcher could not find a system Chrome binary in this container. The repository’s Playwright `@axe-core/playwright` integration ran instead, locally and against the deployed site, using the preinstalled Chromium browser.

## Run and deploy

For local development, run `npm run realtime` and `npm run dev` in separate terminals. Run `npm test` and `npm run build` before release. Static deployment uses `dist/`; the realtime Dockerfile accepts `BUILD_ID` and is deployed as the product-scoped `sf-couch-crew-realtime` image.

## Known gaps

None.
