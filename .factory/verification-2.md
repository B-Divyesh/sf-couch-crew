# Independent verification report — FAIL

**Candidate:** `6a13603b62f89766ceaf92e3d8a0922f3f557ede`  
**Live URL:** <https://couch-crew.sociobot.in>  
**Verified:** 2026-09-02  
**Work order:** `couch-crew-verify-2`  
**Verdict:** **FAIL — do not release.**

The repaired game now serves the researched multiplayer job and the cold first screen passes. The release still fails mandatory quality, server-rate-limit, dependency-security, build-identity, claim-coverage, and keyboard-accessibility gates.

## First read

Cold desktop and 390 px loads show the live game deck in the first viewport. The screen says **“Coordinate a heist from every phone”**, identifies **3–6 phones**, three missions, and 18 minutes, explains that each phone gets one role and two controls, and presents **Try the sample mission**. One click opens `/demo` with a running deterministic game and the persistent **“Demo — sample data, nothing is saved”** banner, **Reset demo**, and **Start for real**.

First-read result: **PASS**. It explains what to play, who plays, and what to click first. The captured screen is the game rather than a menu wall.

## Release-blocking findings

### Blocker — the clean full test gate fails consistently

`npm test` failed on both independent runs. Unit tests passed 7/7, but the browser suite passed 11/13 and timed out after 30 seconds in both registered end-to-end claims:

- `@claim:complete-run`
- `@claim:restart-reset`

Both failure snapshots had already reached **The crew cleared the route**, so the tests are too slow for their configured timeout when run with the suite's two workers. Isolated claim invocations pass, but the repository contract requires the full `npm test` gate to pass. Failure evidence is under `test-results/game-a-sample-run-reaches-the-end-screen-claim-complete-run-chromium/` and `test-results/game-replay-resets-the-sample-run-claim-restart-reset-chromium/`.

### Blocker — the realtime API has no enforced request allowance

No request allowance is documented or implemented in `realtime/server.mjs`. Fresh live probes from one client produced:

- 120/120 `GET /health` responses with status 200, no 429, and no `Retry-After`.
- 40/40 rapid WebSocket handshakes with status 101, no rejection, and no `Retry-After`.

This fails the explicit server-endpoint acceptance requirement.

### High — exposed realtime dependency has a high-severity advisory

`npm audit --omit=dev` fails on direct runtime dependency `ws@8.18.1`:

- `GHSA-96hv-2xvq-fx4p`, high: memory-exhaustion denial of service.
- `GHSA-58qx-3vcg-4xpx`, moderate: uninitialized-memory disclosure.

The non-major fix is available in `ws@8.21.3`.

### High — the WebSocket service accepts arbitrary web origins

A live handshake sent with `Origin: https://attacker.example` upgraded with 101 and successfully created room `5YDJ`. The server does not validate `Origin`. Combined with four-character room codes and no rate limiting, an unrelated site can drive the public room protocol and attempt room discovery.

### High — keyboard focus is not moved into game overlays

After the loss overlay appears, focus remains on an obscured role button. The overlay has no dialog role, no `aria-modal`, and does not make background controls inert. A keyboard user must press Tab 12 times through obscured controls before reaching **Try this run again**. Mission and win overlays use the same structure. This fails the required keyboard-only recovery and dialog focus-management baseline, even though buttons have a good 3 px visible focus ring when unobscured.

### High — the deployed realtime build cannot be matched to the candidate

The static deployment matches the fresh candidate build byte-for-byte, but `https://sf-couch-crew-realtime.sociobot.in/health` returns only `{"service":"couch-crew-realtime","rooms":0}`. It exposes no version, commit, or build identifier. The live realtime binary therefore cannot be tied to candidate `6a13603` as required for a backend-bearing product.

### High — registered and advertised claims are not fully tested

- `settings-persist` claims that settings **and an unfinished run** persist, but its registered test only checks the Calm pressure checkbox after reload. It never advances or asserts recovery of an unfinished run. Independent live QA confirmed recovery works, but the required claim test does not prove its whole claim.
- The landing/privacy/README copy says there are no analytics, ads, or third-party scripts and describes real room traffic, while `local-privacy` covers only the isolated demo. These broader privacy claims have no matching registered test.
- The game contract requires a measured 60 fps claim and test. `claims.json` tests a fixed 60 Hz simulation constant, not rendered frame rate. Independent live sampling measured 60.0 fps over 120 frames, but no registered repeatable frame-rate test exists.

## Other findings

### Medium — home page has duplicate landmarks and IDs

The home page renders two separate **How it works** sections with duplicate `id="how"` and `id="how-title"`. Live axe reports `landmark-unique` with moderate impact. Serious/critical axe findings remain zero on `/`, `/demo`, `/controller`, `/privacy`, `/terms`, and the not-found view.

### Medium — required mobile touch sizes are missed

At 390 px, the crew selector and **Set crew** button are 38 px high. Demo banner controls render at 43 px high. The attached baseline requires controls to be at least 44×44 CSS px.

### Medium — unknown routes return HTTP 200

`/definitely-missing-qa` renders the designed not-found view but responds with HTTP 200, not 404. This is not a real 404 response.

### Low — sitemap and copy audit are stale/incomplete

- `sitemap.xml` omits the public `/controller` route.
- `.factory/copy-audit.md` omits the second How it works section and records obsolete copy (**“Your room stays private”**) instead of the live **“Your room stays on this browser”**. It is not a complete extraction of the current landing page.

## Claim gate run first

`.factory/claims.json` exists. Every listed command was run before broader repository inspection, after `npm ci`, against the configured local product and its declared route.

| Claim | Exact command | Isolated result |
| --- | --- | --- |
| `complete-run` | `npm run test:e2e -- --grep @claim:complete-run` | PASS, 1/1 |
| `session-length` | `npm run test:unit -- --testNamePattern @claim:session-length` | PASS, 1/1 |
| `assist-mode` | `npm run test:unit -- --testNamePattern @claim:assist-mode` | PASS, 1/1 |
| `restart-reset` | `npm run test:e2e -- --grep @claim:restart-reset` | PASS, 1/1 |
| `touch-keyboard` | `npm run test:e2e -- --grep @claim:touch-keyboard` | PASS, 1/1 |
| `crew-size` | `npm run test:e2e -- --grep @claim:crew-size` | PASS, 1/1 |
| `phone-controllers` | `npm run test:e2e -- --grep @claim:phone-controllers` | PASS, 1/1 |
| `settings-persist` | `npm run test:e2e -- --grep @claim:settings-persist` | PASS, but incomplete assertion noted above |
| `demo-isolated` | `npm run test:e2e -- --grep @claim:demo-isolated` | PASS, 1/1 |
| `local-privacy` | `npm run test:e2e -- --grep @claim:local-privacy` | PASS, 1/1 |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS, 1/1 |
| `free-no-account` | `npm run test:e2e -- --grep @claim:free-no-account` | PASS, 1/1 |
| `fixed-timestep` | `npm run test:unit -- --testNamePattern @claim:fixed-timestep` | PASS, 1/1 |

## Functional evidence

- Exact title-to-end live run: `/` showed a live `0 / 12` deck; one click opened the seeded `/demo` at `4 / 12`; correct actions crossed Garage exit, Skybridge, and Vault run; the real end screen said **“The crew cleared the route”** and **“48 correct moves · 0 misses.”**
- Loss and restart: 15 wrong actions reached **“Pressure reached 100.”** **Try this run again** restored route `4 / 12`, pressure `18%`, and the original Dispatcher/Route B prompt. A subsequent full run won.
- Input: a pointer action advanced `4 / 12 → 5 / 12`; the advertised number key advanced `5 / 12 → 6 / 12`; `P` held the timer at 8 seconds while paused.
- Real persistence: after two actions, Calm pressure, and mute were changed, reload restored `2 / 12`, the same prompt, Calm pressure, and Sound off. A completed real run stored `{"runs":1,"wins":1,"bestStreak":48}` and removed the unfinished-run key.
- Crew boundaries: 3 players assign two roles to players 1 and 2 and Dispatcher to player 3; 6 players assign Driver–Loader to players 1–4 and Dispatcher to players 5 + 6.
- Five-phone live room: Driver, Lookout, Hacker, Loader, and Dispatcher were assigned separately. The called Dispatcher phone advanced the host from `0 / 12` to `1 / 12`. A sixth phone received **“Every controller slot is already filled.”** An unknown code received a clear retry message.
- Concurrent rooms had distinct codes and did not leak controller actions. A controller could not send a role it did not own. Closing the host notified the controller and removed the room.
- Demo isolation: no Couch Crew local-storage keys were written. The complete demo request log contained only the product document, hashed JS/CSS, and product art. Real mode additionally opened only `wss://sf-couch-crew-realtime.sociobot.in/`. No analytics or third-party script request was observed.

## Build, deployment, accessibility, and performance

- `npm ci`: completed; reported one high-severity vulnerability.
- `npm run build`: PASS (`tsc --noEmit && vite build`), producing `dist/`. No separate lint script exists.
- Output: JS 25,705 B / 8.90 KB gzip; CSS 18,469 B / 4.94 KB gzip; desktop background 104,084 B. Budgets pass.
- Static deployment identity: fresh `dist/index.html`, hashed JS, hashed CSS, `sw.js`, and main art all exactly match live SHA-256 values. Representative hashes: index `715b99b4…`, JS `2eb20bfc…`, CSS `5abeb4c9…`, SW `3bddd495…`.
- Live routes `/`, `/demo`, `/controller`, `/privacy`, `/terms`, `robots.txt`, and `sitemap.xml` return 200. Hashed assets use `max-age=31536000, immutable`; HTML and service worker use `max-age=30, must-revalidate`.
- Static responses include CSP, HSTS, `nosniff`, referrer policy, and permissions policy. No console or page errors appeared during cold load, complete play, mobile, controller, privacy, terms, or offline checks.
- Lighthouse 12.2.1 mobile: Performance 98, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.5 s, TBT 180 ms, CLS 0.007. Lab INP was unavailable because Lighthouse did not perform an interaction.
- Live axe: zero serious/critical issues on all tested views. Home has the moderate landmark issue above. The site has one `h1`, one `main`, valid `lang`, a skip link, and strong contrast. The first focused element is the skip link with a 3 px cyan outline. Reduced-motion mode has zero running infinite animations and disables road motion.
- Service worker: active and controlling, `registration.update()` completed with no waiting worker, and `/demo` reloaded offline with the game and offline status visible.
- There is no sign-in, so Entra tenant verification is not applicable. There is no payment flow.

## Required remediation

1. Make `npm test` pass reliably under its committed parallel configuration and timeout.
2. Add and document per-client HTTP/WebSocket rate limits that return 429 with `Retry-After` during the handshake when exceeded; restrict accepted WebSocket origins.
3. Upgrade `ws` to a non-vulnerable release and rerun the audit and multiplayer tests.
4. Expose immutable build identity from realtime `/health`, then verify it against the candidate.
5. Move focus into overlays, mark them as modal dialogs, and make obscured controls inert; return focus on close.
6. Make every listed claim test assert its full wording, register the broader privacy and rendered-frame-rate claims, and rerun every claim.
7. Remove the duplicate How it works section/IDs, meet 44 px touch targets, return real 404 status, add `/controller` to the sitemap, and refresh the copy audit.
