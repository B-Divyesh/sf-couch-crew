# Review the cooperative phone heist — PASS

**Work order:** `couch-crew-review-3`  
**Reviewed:** 2026-09-05  
**Live URL:** <https://couch-crew.sociobot.in>  
**Implementation candidate:** `c0270e1d820bc623cfcb689cdc75c434ae228799`  
**Documentation baseline:** `f58092232e595e6bb2e967d7442a576bb583e972`  
**Realtime build identity:** `c0270e1d820bc623cfcb689cdc75c434ae228799`

## Verdict

**PASS — zero findings of every severity and zero untested public claims.**

The live static files match a clean build of the implementation candidate. The
live room service reports the same implementation SHA. Commits after
`c0270e1` and through the documentation baseline change reports only. No
product code was changed during this review.

## First screen

- Job: coordinate a three-mission cooperative heist from different phones.
- Audience: 3–6 friends or family members in one room.
- First action: **Try it with sample data**. It opens a live sample mission.

Fresh 1366×900 desktop and 390×844 phone contexts showed the job, audience,
sample action, and live command deck before scrolling. The desktop deck began
at y=395. The phone deck began at y=419. The phone page stayed within 390 px.

Evidence: `/work/.evidence/couch-crew-review-3/desktop-first-screen.png` and
`phone-first-screen.png`.

## Sample and complete runs

- `/demo` opened at `4 / 12`, 18% pressure, with five assigned roles and the
  persistent **Demo — sample data, nothing is saved** label.
- One correct move advanced the sample to `5 / 12`. **Reset demo** restored
  `4 / 12` and the same seeded call.
- Sample play and reset wrote no `couch-crew:*` keys. A pre-existing real-data
  marker remained byte-for-byte unchanged.
- The correct deterministic run cleared all three missions and reached **The
  crew cleared the route** with **48 correct moves**.
- The wrong-input run reached **Pressure reached 100**. Replay returned to the
  seeded `4 / 12` sample, then a second run reached the win screen.
- Touch, number-key control, pause/resume, dialog focus, and restart behavior
  worked. Sound, screen nudge, Calm pressure, and an unfinished real run all
  survived a live reload.

End-screen evidence: `/work/.evidence/couch-crew-review-3/live-win-screen.png`
and `live-loss-screen.png`.

## Multiplayer and backend

- Five independent 390 px phone contexts joined one live host. They received
  Driver, Lookout, Hacker, Loader, and Dispatcher controls. A called Driver
  action from its phone locked the move on the host.
- Disconnecting one phone changed the host to `4 of 5 phones joined`. A fresh
  phone rejoined the same room and restored `5 of 5`.
- A second host received a different room code and remained at zero connected
  phones while the first room stayed at five. This proves live room isolation.
- A three-character code was rejected by the form. An unavailable four-letter
  code produced a clear correction message.
- Live socket openings 1–8 succeeded. Opening 9 returned 429 with
  `Retry-After: 60`. The phone showed the one-minute wait message, kept **Join
  room** enabled, and joined the same room after the window reset.
- Live health requests 1–60 returned 200. Request 61 returned 429 with
  `Retry-After: 60`. Health reported the full candidate SHA. A hostile socket
  origin returned 403.

Anonymous rooms are deliberately host-owned and ephemeral; the product makes
no server-restart persistence claim. A local process restart check confirmed
that room memory clears, while the promised settings and unfinished run remain
in browser storage. Live controller disconnect/reconnect and host reload
recovery passed. No production service was restarted.

Rate evidence: `/work/.evidence/couch-crew-review-3/live-rate-limit.json`,
`live-health-limit.json`, `live-rate-limit-retry.png`, and
`live-rate-limit-recovered.png`.

## Registered claims

After `npm ci` in a detached clean clone at documentation head `f580922`, every
exact `test` command in `.factory/claims.json` ran independently. All 20
passed. The policy test also proved that every registered claim has exactly
one tagged regression.

| Claim | Result | Observed evidence |
| --- | --- | --- |
| `complete-run` | PASS | Three missions and a 48-move win screen |
| `session-length` | PASS | Paced run ≥14 minutes; representative run about 18 minutes |
| `assist-mode` | PASS | Calm pressure grows more slowly |
| `restart-reset` | PASS | Loss replay restores the sample and can reach win |
| `touch-keyboard` | PASS | Pointer and number-key actions both advance play |
| `crew-size` | PASS | Five roles assigned for 3, 4, 5, and 6 players |
| `phone-controllers` | PASS | Separate phone receives only its assigned controls |
| `settings-persist` | PASS | All settings and an unfinished move survive reload |
| `demo-isolated` | PASS | Sample play and reset preserve real storage |
| `local-privacy` | PASS | Sample requests remain same-origin |
| `real-local-privacy` | PASS | Real play uses only the site and product room socket |
| `offline-reload` | PASS | A fresh service-worker context reloads the sample offline |
| `free-no-account` | PASS | No credential, payment, or checkout controls |
| `fixed-timestep` | PASS | Deterministic simulation rate is 60 Hz |
| `rendered-frame-rate` | PASS | Five 390 px samples; median 60.00 fps |
| `origin-policy` | PASS | Product/local origins accepted; hostile origins rejected |
| `rate-limits` | PASS | Exact 8/9 socket and 60/61 health boundaries |
| `rate-limit-recovery` | PASS | Visible wait guidance and same-room retry after reset |
| `recovery-deletion` | PASS | Win and loss remove the unfinished-run save |
| `no-chat` | PASS | No chat field, send action, or feature |

The landing page, game UI, legal pages, README, demo guide, and claim registry
were cross-checked. No missing, partial, false, or untested public claim was
found. Full command output is in
`/work/.evidence/couch-crew-review-3/claim-commands.log`.

## Accessibility, privacy, routes, and recovery

- Live Playwright axe scans found no serious or critical violation on `/`,
  `/demo`, `/controller`, `/privacy`, `/terms`, or the designed 404.
- Every tested route had `lang=en`, one h1, one main landmark, its own plain
  title and description, no phone-width overflow, and no visible target below
  44×44 px.
- First Tab focused the visible **Skip to the game** link. Pause and terminal
  dialogs moved focus to their main action and made background controls inert.
  Home navigation returned focus to its h1.
- At 200% root text size, the 390 px privacy page retained all content without
  horizontal overflow. Reduced-motion mode exposed no running animation.
- The service worker controlled the sample, had no waiting update, and
  reloaded the playable mission offline with a visible offline notice.
- Sample requests were same-origin. Real play made same-origin requests and
  used only `wss://sf-couch-crew-realtime.sociobot.in`; no analytics,
  advertising, remote font, or third-party script was observed.
- `/`, `/demo`, `/controller`, `/privacy`, `/terms`, `robots.txt`, and
  `sitemap.xml` returned 200. The tested missing route intentionally returned
  HTTP 404 and rendered the designed recovery page, complete footer, and
  44 px targets. The 404 status is expected, not a defect.
- `/privacy` states what is stored and how to delete it. `/terms` is present.
  There is no account, payment, or personal-data request workflow.
- The clean URL verifier passed with a 674 ms network-idle load, valid
  title/lang/main/alt/button checks, and zero console or page errors. A forced
  429 handshake logs the browser's expected failed-socket message while the
  controller presents its tested recovery state; cold load is clean.

## Build and performance

From the detached clean clone:

```text
npm ci                       PASS; 174 packages, 0 vulnerabilities
npm audit --omit=dev         PASS; 0 vulnerabilities
npm run lint                 PASS
npm run typecheck            PASS
npm test                     PASS
npm run build                PASS; dist/ created
```

The full suite passed 8 unit tests, 3 realtime tests, 3 deployment-policy
tests, 21 browser tests, and the isolated frame test. Output is 27.06 kB
JavaScript (9.41 kB gzip), 18.79 kB CSS (5.00 kB gzip), and 34.91 kB mobile
art.

Fresh mobile Lighthouse scores were 100 Performance, 100 Accessibility, 100
Best Practices, and 100 SEO. FCP was 1.05 s, LCP 1.42 s, TBT 15 ms, CLS
0.0069, and transfer was 120.7 kB.

Fresh-build and live SHA-256 values matched for `index.html`, both hashed
assets, the service worker, 404 files, both game images, and social art.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| No real rooms or phone-specific roles | Resolved: five independent live phones received all roles and controlled the host |
| Game hidden below a landing wall | Resolved: the command deck is in the first desktop and phone screens |
| Unstable complete, replay, or frame tests | Resolved: every exact command and full suite pass; frame median is 60.00 fps |
| Vulnerable realtime dependency | Resolved: clean production audit reports zero vulnerabilities |
| Missing origin checks, limits, or build identity | Resolved: live 403, exact 8/60 allowances, `Retry-After`, and candidate identity pass |
| Missing or incomplete claim coverage | Resolved: 20 claims each have one outcome regression and every command passes |
| Duplicate landmarks and incomplete dialog/home focus | Resolved: live axe, skip, dialog, inert-background, and route-focus checks pass |
| Mobile controls below 44 px | Resolved on every visible control across all live routes and the 404 |
| Unknown route returned 200 | Resolved: unknown URLs return the designed HTTP 404 |
| Sitemap and copy audit were stale | Resolved: controller is listed and audited copy matches the live first screen |
| First screen omitted friends in one room | Resolved: the audience sentence is visible before scrolling |
| 404 footer and phone links were incomplete | Resolved: complete footer and 44 px links pass live |
| Demo could change real storage | Resolved: real storage remains unchanged through sample play and reset |
| Phone remained on “Joining room…” after 429 | Resolved: live guidance, enabled retry, exact header, and same-room recovery pass |

## Findings

None.
