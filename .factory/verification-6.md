# Verify the cooperative phone heist — PASS

**Work order:** `couch-crew-verify-6`  
**Verified:** 2026-09-05  
**Live URL:** <https://couch-crew.sociobot.in>  
**Implementation candidate:** `c0270e1d820bc623cfcb689cdc75c434ae228799`  
**Documentation baseline:** `74b1c7142f3f946a020263d958fa82873fd89a5d`

## Verdict

**PASS — zero findings of every severity and zero untested public claims.**

The live static files match a fresh build from the reviewed candidate. The live
room service reports the same full implementation SHA. All 20 exact claim
commands and the complete test suite pass.

## First screen

- Job: coordinate a three-mission cooperative heist from different phones.
- Audience: 3–6 friends or family members in one room.
- First action: **Try it with sample data**. It opens an active sample mission.

Fresh 1366×900 desktop and 390×844 phone contexts showed those three items and
the live command deck before scrolling. The first screen was the game, not a
menu. The phone page had no horizontal overflow.

Evidence: `/work/.evidence/couch-crew-verify-6/desktop-first-screen.png` and
`phone-first-screen.png`.

## Demo and complete game runs

- One click opened `/demo` at `4 / 12` with five assigned roles and the
  persistent **Demo — sample data, nothing is saved** label.
- One correct action advanced the sample to `5 / 12`. **Reset demo** restored
  `4 / 12` and the seeded call.
- A real local-storage record set before entering the demo was unchanged after
  sample play and reset. Demo play wrote no Couch Crew game keys.
- **Start for real** removed the demo label, returned to `/`, and opened a real
  anonymous room.
- A deterministic correct run completed Garage exit, Skybridge, and Vault run.
  The end screen said **The crew cleared the route** and **48 correct moves**.
- A wrong-input run ended at **Pressure reached 100**. Replay/reset behavior
  restored the sample state.

End-screen evidence: `/work/.evidence/couch-crew-verify-6/live-win-screen.png`
and `live-loss-screen.png`.

## Claims

Every exact `test` command in `.factory/claims.json` ran independently after
`npm ci` in a detached clean checkout. All 20 passed.

| Claim | Result | Evidence |
| --- | --- | --- |
| `complete-run` | PASS | Three missions and 48-move win screen |
| `session-length` | PASS | Fastest paced run ≥14 minutes; representative session 17–18 minutes |
| `assist-mode` | PASS | Calm pressure grows more slowly |
| `restart-reset` | PASS | Loss replay restores the seeded sample and a new run reaches win |
| `touch-keyboard` | PASS | Pointer and number-key actions each advance the route |
| `crew-size` | PASS | Five roles checked for crews of 3, 4, 5, and 6 |
| `phone-controllers` | PASS | Separate phone receives assigned controls |
| `settings-persist` | PASS | Settings and an unfinished move survive reload |
| `demo-isolated` | PASS | Sample play and reset leave real storage unchanged |
| `local-privacy` | PASS | Demo requests are same-origin only |
| `real-local-privacy` | PASS | Real play uses only the site and product room socket |
| `offline-reload` | PASS | Fresh service-worker context reloads the demo offline |
| `free-no-account` | PASS | No credential, checkout, or payment controls |
| `fixed-timestep` | PASS | Simulation rate is 60 Hz |
| `rendered-frame-rate` | PASS | Five 390 px samples; median 60.00 fps |
| `origin-policy` | PASS | Production and local origins allowed; hostile origins rejected |
| `rate-limits` | PASS | Eight socket openings and 60 health checks allowed; next requests return 429 with `Retry-After` |
| `rate-limit-recovery` | PASS | Phone gets retry guidance, remains actionable, and joins after reset |
| `recovery-deletion` | PASS | Win and loss remove the unfinished-run save |
| `no-chat` | PASS | No chat input, send control, or feature |

Landing copy, legal pages, the README, and the claim registry were
cross-checked. No missing, false, partial, or untested public claim was found.

## Multiplayer and backend

- Five independent 390 px phone contexts joined one live host. They received
  Driver, Lookout, Hacker, Loader, and Dispatcher controls. The called phone
  action changed the host to **Move locked**.
- Disconnecting Driver changed the host to `4 of 5 phones joined`. A fresh
  phone rejoined the same room and restored `5 of 5`, proving room continuity.
- Two additional live hosts received different room codes. A phone joining one
  changed only that room to one connected player; the other stayed at zero.
- In a synchronized clean live allowance window, openings 1–8 succeeded and
  opening 9 returned HTTP 429 with `Retry-After: 59`. A fresh phone showed
  **The room service is busy. Wait one minute, then join again.**, kept **Join
  room** enabled, and joined the same room after that reported window.
- The live health endpoint allowed requests 1–60. Request 61 returned HTTP 429
  with `Retry-After: 60`. Its build identity was the full candidate SHA.
- A hostile WebSocket origin returned 403.
- A three-character room code was rejected before submission. An unavailable
  four-character room showed a clear correction message.

Rate-limit evidence:
`/work/.evidence/couch-crew-verify-6/live-rate-limit-retry.png` and
`live-rate-limit-recovered.png`.

Rooms are intentionally anonymous, host-owned, in-memory sessions. The product
does not promise durable server rooms across a service restart. Persistent
player state stays in the browser: sound, screen nudge, calm pressure, and an
unfinished run all survived reload. No service restart was needed or performed.

## Accessibility, privacy, routes, and recovery

- Playwright axe found zero violations on `/`, `/demo`, `/controller`,
  `/privacy`, `/terms`, and the designed 404.
- Every route had `lang=en`, one h1, one main landmark, a unique plain title,
  no 390 px overflow, and no visible target smaller than 44×44 px.
- First Tab focused the skip link. It targeted `main`. Pause moved focus to
  **Resume this run**, made game controls inert, and returned focus on resume.
  Back navigation restored focus to the home heading.
- At 200% root text size, the phone layout retained its content without
  horizontal overflow. Reduced-motion mode exposed no running animations.
- The service worker controlled the demo, had no waiting update, and reloaded
  the playable sample offline with a visible offline status.
- Demo requests were same-origin. Real play loaded same-origin files and only
  `wss://sf-couch-crew-realtime.sociobot.in`; no analytics, advertising,
  remote font, or third-party script was observed.
- `/`, `/demo`, `/controller`, `/privacy`, `/terms`, `robots.txt`,
  `sitemap.xml`, and the external Param Factory link returned 200. The tested
  missing route intentionally returned its designed HTTP 404 with recovery
  links and a complete footer.
- `/privacy` explains local data and deletion. `/terms` is present. There is no
  account, payment, or personal-data request workflow.
- Security headers include HSTS, `nosniff`, strict-origin referrer policy,
  restrictive permissions policy, and a CSP limited to the product room
  socket with `frame-ancestors 'none'`.

The required URL verifier passed with HTTP 200, a 728 ms network-idle load,
valid title/lang/main/alt/button checks, and no console or page errors. Its
output is under `/work/.evidence/couch-crew-verify-6/url-verifier/`.

## Clean quality gates and performance

```text
npm ci                       PASS; 174 packages, 0 vulnerabilities
npm audit --omit=dev         PASS; 0 vulnerabilities
npm run lint                 PASS
npm run typecheck            PASS
npm test                     PASS
npm run build                PASS; dist/ created
```

The full suite passed 8 unit tests, 3 realtime tests, 3 deployment-policy
tests, 21 browser tests, and the isolated frame test. Initial output is 27.06
kB JavaScript (9.41 kB gzip), 18.79 kB CSS (5.00 kB gzip), and 34.91 kB mobile
art.

Fresh mobile Lighthouse scores were 100 Performance, 100 Accessibility, 100
Best Practices, and 100 SEO. FCP was 0.98 s, LCP 1.45 s, TBT 46.5 ms, CLS
0.0069, and transfer 120.8 kB. Evidence:
`/work/.evidence/couch-crew-verify-6/lighthouse.json`.

Fresh and live SHA-256 values matched for `index.html`, the hashed JavaScript,
CSS, service worker, both responsive game images, and social image. Later
commits after `c0270e1` contain documentation only.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| No real rooms or phone-specific roles | Resolved: independent live clients received all five roles and controlled the host |
| Game hidden below a landing wall | Resolved: live desktop and phone first screens show the command deck |
| Unstable complete, replay, or frame tests | Resolved: exact commands and full clean suite pass; frame median is 60.00 fps |
| Vulnerable dependency | Resolved: clean production audit reports zero vulnerabilities |
| Missing origin checks, rate limits, or build identity | Resolved: live hostile origin 403, exact 8/60 boundaries, `Retry-After`, and candidate identity pass |
| Incomplete claim coverage | Resolved: 20 claims each have one tagged outcome regression; every command passes |
| Duplicate landmarks, dialog focus, home focus, and mobile targets | Resolved: zero live axe violations; focus and target checks pass |
| Unknown route returned 200; sitemap and copy audit were stale | Resolved: designed HTTP 404, current sitemap, and current copy audit pass |
| First screen omitted friends in one room | Resolved: the audience sentence is visible before scrolling |
| 404 footer and links were incomplete or too small | Resolved: live designed 404 has the full footer and 44 px targets |
| Demo could change real storage | Resolved: live before/after storage snapshots are identical |
| Phone stayed on “Joining room…” after 429 | Resolved: live retry guidance and same-room recovery pass |

## Findings

None.
