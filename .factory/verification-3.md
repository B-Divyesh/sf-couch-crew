# Independent verification report — FAIL

**Candidate:** `07fec1d909849b67792ea1b34f973030acd615a3`  
**Live URL:** <https://couch-crew.sociobot.in>  
**Verified:** 2026-09-02  
**Work order:** `couch-crew-verify-3`  
**Verdict:** **FAIL — do not release.**

The deployed game is playable through both terminal states, its static files match the candidate, and the repaired room service works. The candidate still fails the mandatory full test gate twice, misses the strict first-screen audience requirement, and does not adequately register or prove several user-facing claims.

## First-read gate

A cold desktop load returned 200 and immediately showed the real command deck at `0 / 12`, not a menu wall. The first viewport contained:

- **“Coordinate a heist from every phone”**
- **“3–6 phones · 3 missions · 18 minutes”**
- **“Share the room code. Each phone gets one role and two controls.”**
- **“Try the sample mission”**

One click opens `/demo`, already in mission one at `4 / 12`, with the persistent **“Demo — sample data, nothing is saved”** banner, **Reset demo**, and **Start for real**. This satisfies the one-click sample and captured-game requirements.

First-read result: **FAIL.** The visible first screen explains the activity and first action, but it identifies devices (“3–6 phones”), not the people or situation (“3–6 friends in one room”). The only visible copy that explicitly says “friends” is in the footer below the product. The contract requires what, for whom, and what to click first in plain words on the first screen; failure of any one is dispositive.

## Release-blocking findings

### Blocker — the required full test gate fails consistently

`npm test` failed in both clean verification runs under the committed two-worker Playwright configuration. Unit tests passed 7/7, realtime tests 1/1, deployment-policy tests 2/2, and browser tests 15/16. The same registered claim failed both times:

- `@claim:rendered-frame-rate`: expected 50–65 fps; measured **31.3166 fps** and **32.9038 fps**.

The current trace and screenshot are under `test-results/game-the-live-game-renders-db65c-n-claim-rendered-frame-rate-chromium/`. The claim passes when isolated, and independent production samples measured 60.00 fps normally and 58.05 fps with 4× CPU throttling. This distinguishes healthy live rendering from a concurrency-sensitive benchmark that makes the mandatory gate fail. Definition of done nevertheless requires `npm test` to pass.

### Blocker — registered claim tests do not prove their full wording

- `session-length` adds the 48 maximum prompt deadlines and obtains 1,064 seconds (17:44). It does not play or time a completed session. Correct moves advance immediately, so an all-correct run can finish as quickly as inputs are dispatched. This does not prove an 18-minute normal session or the brief's completion target above 14 minutes.
- `crew-size` claims assignments for 3–6 players, but its exact registered test selects only six players. It never asserts the three-, four-, or five-player assignments. Independent live QA found those UI assignments present, but the mandatory claim test is incomplete.

### Blocker — user-facing claims are absent from `claims.json`

The README promises that the room service accepts only Couch Crew/local origins and enforces 8 WebSocket openings plus 60 health checks per client per minute. The privacy page promises that completed or lost runs remove their recovery save. Landing copy promises no chat. None has a corresponding entry in `.factory/claims.json`, even though some behavior is covered by untagged tests. The claims contract says an unlisted visitor-facing claim fails review until registered and tested or removed.

## Other findings

### High — the 18-minute core-session promise is not borne out by the loop

The brief calls for an 18-minute cooperative heist and measures whether median completion exceeds 14 minutes. The implementation has 48 instant-advance prompts and no minimum pacing. The passing unit test measures theoretical response ceilings, not actual session duration. A normal responsive crew can complete far below the promised duration.

### Medium — SPA navigation does not focus the home heading

Navigating from `/privacy` to `/` through the wordmark leaves `document.activeElement` on `<body>`. Other routes focus their `h1` because they carry `tabindex="-1"`; the home heading does not. This breaks the documented route-change focus behavior for keyboard and screen-reader users.

### Medium — some 390 px touch targets are below 44 px

The game buttons, demo controls, checkboxes via their labels, and host setup controls meet 44 px. The mobile footer Privacy, Terms, and Param Factory links are only 21.1 px high; Terms is also 40 px wide. The top Demo link measured 43.7 px wide. This misses the attached accessibility baseline.

## Mandatory claim gate

`.factory/claims.json` exists and contains 15 entries, each with one tagged test. The first pre-install invocation could not load `@playwright/test`, as expected in a clone without `node_modules`; after `npm ci`, every exact listed command was run independently and passed:

| Claim | Result |
| --- | --- |
| `complete-run` | PASS, real win screen and 48 correct moves |
| `session-length` | PASS mechanically; inadequate assertion noted above |
| `assist-mode` | PASS |
| `restart-reset` | PASS |
| `touch-keyboard` | PASS |
| `crew-size` | PASS mechanically; incomplete 3–6 coverage noted above |
| `phone-controllers` | PASS |
| `settings-persist` | PASS |
| `demo-isolated` | PASS |
| `local-privacy` | PASS |
| `real-local-privacy` | PASS locally |
| `offline-reload` | PASS |
| `free-no-account` | PASS |
| `fixed-timestep` | PASS |
| `rendered-frame-rate` | PASS alone; fails in full gate twice |

Running the repository suite serially against production passed 15/16. Its only failure was the local-only socket assertion in `real-local-privacy`, which requires `ws://127.0.0.1:8787` even when `PLAYWRIGHT_BASE_URL` is production. An independent request log proved the intended live policy: documents and assets were same-origin and the only socket was `wss://sf-couch-crew-realtime.sociobot.in/`.

## Functional game evidence

- Cold `/` showed the active game at `0 / 12` and a one-click demo action.
- `/demo` started deterministically at `4 / 12`, 18% pressure, Dispatcher / Route B.
- A scripted correct run crossed Garage exit, Skybridge, and Vault run, then reached **“The crew cleared the route”** with **“48 correct moves · 0 misses.”**
- Wrong controls reached **“Pressure reached 100.”** Both win replay and loss replay restored the documented initial sample state.
- Pointer and number-key input advanced the route. `P` opened a modal pause dialog, moved focus to Resume, made background controls inert, and returned focus after resume.
- Calm pressure, mute, Screen nudge, and an unfinished `1 / 12` real run survived reload. Completing a real run stored `{runs:1,wins:1,bestStreak:48}` and removed the recovery save. Replay reset to `0 / 12` and mission-one briefing.
- Live UI assignments were inspected for 3, 4, 5, and 6 players. All five roles remained assigned; six players shared Dispatcher.
- A three-character room code was rejected by native form validation. An unknown four-letter code produced **“That room is unavailable. Check the four-letter code.”**

## Multiplayer and backend evidence

- Two simultaneous rooms received distinct codes. A controller could act only for its assigned role; an unauthorized action received **“That control belongs to another phone.”** A valid action reached its host. Closing the host notified its controller and removed the room.
- A six-player room assigned its first phone only Driver controls; a three-player room assigned its first phone Driver and Loader, matching the role map.
- A hostile WebSocket origin returned 403.
- WebSocket allowance observed: handshakes 1–8 returned 101; handshake 9 returned 429 with `Retry-After: 60`.
- Health allowance observed: requests 1–60 returned 200; request 61 returned 429 with `Retry-After: 60`.
- Health returned `buildId: 7f9637ae39bd54a36dee559cc174518d5436f773`. Candidate commits after `7f9637a` change only `.factory/handoff.md`, so this is the candidate's latest runtime code even though the service identity is the code-changing ancestor.
- Rooms are anonymous in-memory state and disappear when the host closes or the 30-minute expiry runs; no account or durable server data is involved.

## Privacy, accessibility, PWA, and errors

- Demo flow requests were only `/demo`, the hashed same-origin JS/CSS, and same-origin art. Demo local storage remained empty.
- Real flow made the same same-origin document/asset requests and opened only the product-owned realtime socket. No analytics, ads, third-party script, font, or tracker request appeared.
- Browser response headers include CSP, HSTS, `nosniff`, referrer policy, and permissions policy. The CSP restricts connections to self plus the product realtime service.
- Live Playwright axe checks found zero serious/critical violations and no duplicate-landmark finding on `/`, `/demo`, `/controller`, `/privacy`, and `/terms`.
- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, 710 ms network-idle load, title and `lang=en`, one `h1`, one `main`, zero missing image alt attributes, zero unlabeled buttons, and zero console/page errors. It wrote desktop/mobile captures and `verify.json` under `/tmp/couch-crew-verify-3.dQNoTX`.
- All tested routes have `lang=en`, a route-specific title, exactly one `h1`, one `main`, valid same-origin links, and no console or page errors on ordinary cold flows.
- The first Tab focuses **Skip to the game** with a 3 px cyan outline. Dialog focus/inert behavior passes. Reduced-motion mode exposed no running animations.
- The service worker was active and controlling, `registration.update()` completed with no waiting worker, and `/demo` reloaded offline with **“You’re offline. This run still works.”**
- There is no sign-in or payment flow, so Entra authority and billing checks are not applicable.

## Build, deployment, and performance

- `npm ci`: PASS; 97 packages installed, zero audit findings.
- `npm audit --omit=dev`: PASS, zero vulnerabilities.
- `npm run build`: PASS (`tsc --noEmit && vite build`), producing `dist/`. No lint script exists.
- Output: JS 25.81 kB / 8.95 kB gzip; CSS 18.47 kB / 4.93 kB gzip; 640 px art 34.91 kB; 1280 px art 104.08 kB. Budgets pass.
- Fresh local and live SHA-256 matched for `index.html`, hashed JS, hashed CSS, `sw.js`, and both responsive art files. Live runtime content therefore matches the candidate.
- `/`, `/demo`, `/controller`, `/privacy`, `/terms`, `robots.txt`, and `sitemap.xml` returned 200; an unknown route returned the designed 404 with HTTP 404.
- Hashed JS/CSS use `max-age=31536000, immutable`; HTML and `sw.js` use `max-age=30, must-revalidate`; art uses a seven-day cache.
- Lighthouse 12.2.1 mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 0.995 s, LCP 1.377 s, TBT 146.5 ms, CLS 0.0071, transfer 120,231 bytes. Lab INP was unavailable because the run had no interaction.
- Independent frame sampling: 60.00 fps at 390×844; 58.05 fps with 4× CPU throttling.

## Required remediation

1. Make `npm test` pass reliably under its committed configuration; isolate the frame benchmark from parallel browser contention or use a deterministic performance harness.
2. Put the intended audience in visible first-screen copy, for example “for 3–6 friends in one room.”
3. Replace the timeout-sum session test with a representative timed play model and adjust pacing/content so a normal completion genuinely approaches 14–18 minutes.
4. Make each registered claim assert its entire wording, and register or remove the rate-limit, origin, no-chat, and save-removal promises.
5. Add programmatic focusability to the home `h1` and restore focus there on SPA navigation.
6. Bring every mobile link target to at least 44×44 CSS px.
