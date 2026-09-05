# Review Couch Crew’s cooperative phone heist — FAIL

**Work order:** `couch-crew-review-2`  
**Reviewed:** 2026-09-05  
**Live URL:** <https://couch-crew.sociobot.in>  
**Implementation candidate:** `1f6b13e49dac4f200c4b625245e92371a9401f2c`  
**Prior documentation baseline:** `470ec02204990f3845cf034456a56a8087cdbedf`  
**Review starting head:** `4d4ac232f535c942f7ba7543fe39dcaeb0b20a0b`  
**Realtime build identity:** `e2d48b7435badb3b64b6daabc540da3d2550a1e4`

## Verdict

**FAIL — one medium finding and zero untested public claims.**

The normal game, demo, multiplayer, accessibility, privacy, offline, route,
performance, and clean-build paths pass. The phone controller does not recover
or explain what to do when the room service applies its advertised socket rate
limit. It remains on “Joining room…” after the server returns HTTP 429.

## First screen

Job: coordinate a three-mission cooperative heist from different phones.

Audience: 3–6 friends or family members in one room.

First action: **Try it with sample data**. It opens an active seeded mission.

Fresh 1366×900 desktop and 390×844 phone contexts showed the job, audience,
sample action, and live command deck before scrolling. On desktop, the sample
action began at y=311 and the deck at y=395. On phone, the action ended at
y=353 and the deck began at y=419. The phone page was exactly 390 px wide.

## Finding

### Medium — a rate-limited phone remains on “Joining room…”

The product-owned room service correctly accepted eight WebSocket openings in
one allowance window. The next production handshake returned HTTP 429 with a
valid `Retry-After` header. That response is expected and is not the defect.

The live phone controller does not turn the failed handshake into a useful
state. After pressing **Join room** at the limit, it continued to say
**“Joining room…”** after five seconds. The browser recorded the failed 429
handshake, but the page gave no failure message, wait time, or retry advice.
The same behavior caused the otherwise passing live browser suite to stop at
19/20 until the allowance reset. The isolated phone-room flow passed after the
reset.

This affects a realistic recovery path. A host and five phones on one shared
network use six of the eight openings; reconnecting devices can reach the
limit. The game still has shared-screen controls, so this is medium rather than
high severity.

**Repair:** handle a controller socket that closes before joining. Replace the
pending text with a clear message such as “The room service is busy. Wait one
minute, then join again.” Keep the Join room action available, and add a live
browser regression that reaches the enforced 429 boundary and verifies the
message and successful retry after reset.

Evidence: `/work/.evidence/review-2/live-controller-rate-limit.png`.

## Game, demo, and multiplayer evidence

- `/demo` opened at `4 / 12` with the persistent **Demo — sample data,
  nothing is saved** label, **Reset demo**, and **Start for real**.
- A correct sample action advanced to `5 / 12`; reset restored `4 / 12`.
  Entering, playing, and resetting the demo left the pre-existing real
  local-storage snapshot byte-for-byte unchanged.
- The deterministic correct run cleared Garage exit, Skybridge, and Vault run.
  Its end screen said **The crew cleared the route** and
  **48 correct moves · 0 misses · best streak 46**.
- A wrong-input run reached **Pressure reached 100**. Replay restored the
  seeded `4 / 12` sample. Screenshots of both terminal states are under
  `/work/.evidence/review-2/`.
- After a clean allowance reset, one desktop host and five independent 390 px
  phone contexts joined the same live room. The phones received Driver,
  Lookout, Hacker, Loader, and Dispatcher respectively. A phone’s called
  **Lift case** action changed the host to **Move locked**.
- One phone disconnected, the host changed to `4 of 5 phones joined`, and a
  fresh phone rejoined the same room. The host returned to `5 of 5 phones
  joined`, proving room continuity across a controller reconnect.
- A valid but missing room produced **That room is unavailable. Check the
  four-letter code.** Touch and number-key paths, pause/resume focus, Calm
  pressure, saved unfinished runs, win/loss recovery deletion, and replay
  passed live or in the clean browser suite.

## Declared claims

After `npm ci`, every exact `test` command in `.factory/claims.json` was run
independently from a detached clean checkout. All 19 passed, and each claim has
exactly one tagged regression.

| Claim | Result | Evidence |
| --- | --- | --- |
| `complete-run` | PASS | Three missions; 48-move win summary |
| `session-length` | PASS | Deterministic paced and representative durations |
| `assist-mode` | PASS | Calm pressure grows more slowly |
| `restart-reset` | PASS | Loss replay restores seeded sample |
| `touch-keyboard` | PASS | Pointer and number key each advance play |
| `crew-size` | PASS | Five roles checked for 3, 4, 5, and 6 players |
| `phone-controllers` | PASS | Independent host and phone receive scoped controls |
| `settings-persist` | PASS | Calm mode and unfinished move survive reload |
| `demo-isolated` | PASS | Demo and reset preserve real storage |
| `local-privacy` | PASS | Demo requests are same-origin only |
| `real-local-privacy` | PASS | Real play uses only product-owned services |
| `offline-reload` | PASS | Fresh service-worker context reloads demo offline |
| `free-no-account` | PASS | No credentials, checkout, or payment controls |
| `fixed-timestep` | PASS | Deterministic simulation is 60 Hz |
| `rendered-frame-rate` | PASS | Clean 390 px median 60.00 fps; live median 60.00 fps |
| `origin-policy` | PASS | Hostile production WebSocket Origin returned 403 |
| `rate-limits` | PASS | 8 socket/60 health allowances; next calls returned 429 with `Retry-After` |
| `recovery-deletion` | PASS | Win and loss remove unfinished-run storage |
| `no-chat` | PASS | No chat input, send control, or feature |

The landing page, legal pages, and README were cross-checked against the
registry. No unlisted or partly tested public claim was found. The finding is
a missing recovery state, not a false rate-limit claim.

## Clean quality gates and live match

- `npm ci`: PASS; 174 packages installed and 0 vulnerabilities.
- `npm audit --omit=dev`: PASS; 0 vulnerabilities.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS — unit 8/8, realtime 3/3, deployment policy 3/3,
  browser 20/20, and isolated performance 1/1.
- `npm run build`: PASS; `dist/` created.
- Initial JavaScript is 26.83 kB (9.29 kB gzip); CSS is 18.79 kB
  (5.00 kB gzip). Mobile art is 34.91 kB.
- Live and fresh-build SHA-256 values match for `index.html`, JavaScript, CSS,
  `sw.js`, and all three production art files. Later commits through the review
  starting head change documentation only.
- Lighthouse 12.2.1 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 0 ms, CLS 0.007, 118 KiB transfer.

## Accessibility, privacy, routes, and recovery

- The live URL verifier passed: HTTP 200, 660 ms network-idle load, descriptive
  title, `lang=en`, one h1, one main, all image alt attributes, labeled
  buttons, and no cold-load console or page errors.
- Live Playwright axe checks found no serious or critical issue on `/`,
  `/demo`, `/controller`, `/privacy`, `/terms`, or the real 404. Color contrast
  is included in that scan. The first Tab focused the visible skip link.
- Pause and result dialogs moved focus to their primary actions and made the
  game controls inert. Returning home moved focus to the new h1.
- Every visible link, button, select, text input, and checkbox label in the
  390 px route sweep measured at least 44×44 px. Reduced-motion mode exposed
  zero running animations.
- Demo traffic was same-origin. Real play used same-origin files and only
  `wss://sf-couch-crew-realtime.sociobot.in`; no analytics, advertising,
  third-party scripts, or remote fonts appeared.
- `/`, `/demo`, `/controller`, `/privacy`, `/terms`, `robots.txt`, and
  `sitemap.xml` returned 200. Links resolved successfully. `/not-found`
  deliberately returned its designed HTTP 404; that expected status is not a
  defect. Every application route had its own title, one h1, and one main.
- The service worker controlled `/demo`, updated without a waiting worker, and
  reloaded the playable mission offline with the offline status visible.
- Security headers include HSTS, `nosniff`, strict-origin referrer policy,
  restrictive permissions policy, and a CSP limited to self plus the product
  room socket. The live room service reports its build identity and rejects a
  hostile Origin with 403.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| No real rooms or phone-specific roles | Resolved: five independent live phones received all five roles and controlled the host |
| Game hidden below a landing wall | Resolved: command deck appears in the first desktop and phone screens |
| Unstable complete-run, replay, or frame tests | Resolved: exact commands and consolidated clean suite pass; 60.00 fps median |
| Vulnerable `ws` dependency | Resolved: clean production audit reports zero vulnerabilities |
| Missing origin checks, rate limits, or build identity | Server behavior resolved: hostile Origin 403, exact allowances return 429/`Retry-After`, build identity present; the new controller recovery finding remains |
| Incomplete or missing claim coverage | Resolved: 19 complete claims, one tagged regression each, zero untested public claims |
| Duplicate landmarks, dialog focus, home focus, or mobile targets | Resolved on all normal and terminal views |
| Unknown route returned 200; sitemap and copy audit stale | Resolved: designed HTTP 404, controller sitemap entry, and current copy audit |
| First screen omitted friends in one room | Resolved: exact audience sentence is visible before scrolling |
| Review 1: incomplete 404 footer and small links | Resolved: full footer and 44 px targets pass live |
| Demo could overwrite real storage | Resolved: live before/after storage snapshots are identical |

## Required next step

Repair the phone controller’s pre-join socket-close state, deploy it, and test
the live 429 boundary followed by a successful retry. The current release does
not qualify for PASS while this medium finding remains.
