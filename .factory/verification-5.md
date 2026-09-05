# Independent verification report — PASS

**Candidate implementation:** `1f6b13e49dac4f200c4b625245e92371a9401f2c`  
**Documentation baseline:** `470ec02204990f3845cf034456a56a8087cdbedf`  
**Live URL:** <https://couch-crew.sociobot.in>  
**Verified:** 2026-09-05  
**Work order:** `couch-crew-verify-5`

## Verdict

**PASS — zero findings and zero untested public claims.**

Fresh `1f6b13e` output matches live HTML, JavaScript, CSS, service worker, and original art by SHA-256. The room service identifies its code-bearing ancestor `e2d48b7435badb3b64b6daabc540da3d2550a1e4`. `470ec02` is the separate documentation baseline and changes no product code.

## First screen and demo

- Job: coordinate a three-mission cooperative heist from different phones.
- Audience: 3–6 friends or family members in one room.
- First action: **Try it with sample data**; it opens an active seeded mission.

Fresh 1366×900 desktop and 390×844 phone contexts showed the actual command deck, headline, audience sentence, and sample action before scrolling. The deck was visible at y=395 on desktop and y=419 on phone; the sample action was visible at y=311 and y=309. Phone scroll width was exactly 390 px; first Tab focused **Skip to the game**; reduced-motion mode had zero running animations.

Live `/demo` showed the persistent **“Demo — sample data, nothing is saved”** label. It began at `4 / 12`, advanced after a correct action, and Reset demo restored `4 / 12`. The live complete-run regression reached **“The crew cleared the route”** with **“48 correct moves · 0 misses”**. The live replay regression reached **“Pressure reached 100”** and restored the sample. The isolation regression proved demo play and reset do not change pre-existing real storage.

## Claims and local quality gates

`npm ci` completed; `npm audit --omit=dev` found zero vulnerabilities. Every exact command declared in `.factory/claims.json` was run independently after install: all 19 passed. The consolidated suite passed: 8 unit tests, 3 realtime tests, 3 deployment-policy tests, 20 browser tests, and the isolated frame test. `npm run lint`, `npm run typecheck`, and `npm run build` passed; `dist/` exists.

| Claim | Result | Evidence |
| --- | --- | --- |
| `complete-run` | PASS | Live demo reaches win screen and 48-move summary. |
| `session-length` | PASS | Deterministic pacing assertion passes. |
| `assist-mode` | PASS | Calm pressure is slower in seeded runs. |
| `restart-reset` | PASS | Live loss/replay restores the sample. |
| `touch-keyboard` | PASS | Pointer and number key advance route. |
| `crew-size` | PASS | Roles asserted for crews 3, 4, 5, and 6. |
| `phone-controllers` | PASS | Desktop host and 390 px phone join with scoped controls. |
| `settings-persist` | PASS | Calm pressure and unfinished move survive reload. |
| `demo-isolated` | PASS | Live demo/reset leaves real storage unchanged. |
| `local-privacy` | PASS | Demo requests are same-origin only. |
| `real-local-privacy` | PASS | Real play permits only product network services. |
| `offline-reload` | PASS | Live `/demo` reloads offline after first visit. |
| `free-no-account` | PASS | No credential, checkout, or payment control exists. |
| `fixed-timestep` | PASS | Deterministic simulation is 60 Hz. |
| `rendered-frame-rate` | PASS | 390 px median is 60.00 fps. |
| `origin-policy` | PASS | Hostile WebSocket Origin returned 403. |
| `rate-limits` | PASS | 8/60 accepted; next request 429 with `Retry-After: 60`. |
| `recovery-deletion` | PASS | Both terminal states remove recovery data. |
| `no-chat` | PASS | No chat input, send control, or feature exists. |

Initial application JavaScript is 26.83 kB (9.29 kB gzip) and CSS is 18.79 kB (5.00 kB gzip), within stated static budgets.

## Live routes, accessibility, privacy, and recovery

- `/`, `/demo`, `/controller`, `/privacy`, `/terms`, `robots.txt`, and `sitemap.xml` returned 200. `/not-found` deliberately returned designed HTTP 404; that status is expected, not a defect.
- Live axe found no serious or critical issues on home, demo, controller, privacy, terms, and the real 404. All 390 px controls, including 404 links, passed the 44×44 px target regression.
- The live URL verifier passed: HTTP 200, 639 ms load, title, `lang=en`, one h1, main landmark, zero missing alts, zero unlabeled buttons, and no errors.
- The 404 has its route title, recovery text, Privacy, Terms, **Built by Param Factory**, version 1.0.0, no phone overflow, and 44 px minimum targets.
- A clean live phone-controller run passed. A repeat immediately after the intentional rate-limit probe stayed on “Opening room…” as expected; it passed after the tested allowance reset. This is not a user-path defect.
- Demo writes no product local storage. Observed real traffic was same-origin content plus `wss://sf-couch-crew-realtime.sociobot.in`; no tracker, ad, third-party script, or remote font appeared.
- Headers include HSTS, restrictive CSP, `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and restrictive permissions policy. The live service-worker offline-reload claim passed.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| No rooms or phone-specific roles | Resolved: independent live host/phone claim passed. |
| Landing wall before the playable game | Resolved: first screens show the command deck. |
| Unstable end-screen or frame tests | Resolved: clean suite passed; median is 60.00 fps. |
| Missing origin checks, limits, or identity | Resolved: 403, exact 8/60 limits, and live identity verified. |
| Incomplete claim coverage | Resolved: 19 claims have one tagged regression and all commands passed. |
| Focus, dialog, landmark, and mobile issues | Resolved: keyboard, axe, dialog, and 390 px checks passed. |
| Unknown route, sitemap, or copy gaps | Resolved: real 404 and required routes/copy are present. |
| Review 1 404 targets and footer | Resolved: live footer/target regression passed. |
| Demo could overwrite real storage | Resolved: live demo-isolation regression passed. |

## Findings

None.
