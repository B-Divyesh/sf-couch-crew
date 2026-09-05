# Review Couch Crew's cooperative phone heist — FAIL

**Work order:** `couch-crew-review-1`  
**Reviewed:** 2026-09-05  
**Live URL:** <https://couch-crew.sociobot.in>  
**Implementation candidate:** `04a1383201c70810f4fe3e54d4d473c42869fd4c`  
**Documentation head:** `d74f520ee422a689b50fecfa180760b3c7e97c86`  
**Realtime build identity:** `e2d48b7435badb3b64b6daabc540da3d2550a1e4`

## Verdict

**FAIL — one medium finding.** There are no untested registered claims.

`04a1383` is the final implementation change. `621189a`, `0d27a4d`, and
`d74f520` change only handoff or verification documents. Fresh local output
from the reviewed tree matched the live `index.html`, JS, CSS, and service
worker byte-for-byte. The live room service identifies its code-bearing
ancestor `e2d48b7`; later implementation commits do not change that service.

## First screen

Job: coordinate a three-mission cooperative heist with different phone roles.

Audience: 3–6 friends or family members in one room.

First action: select **Try it with sample data**. It opens `/demo` into an
active sample mission without setup.

A fresh 1366×900 desktop context and a separate 390×844 phone context both
showed the live command deck before scrolling. The phone view kept the
headline, audience sentence, sample action, and active controls in the first
screen. The desktop and phone captures are under
`/tmp/couch-crew-review-live.vfXeof/` in this review environment.

## Finding

### Medium — the real 404 page misses the mobile target and footer requirements

`GET /reviewer-missing-route` correctly returns HTTP 404 and renders a styled
recovery page. The HTTP status is expected and is not this finding.

The static page at `public/404.html` bypasses the normal application shell.
At a 390 px viewport its wordmark, Demo, Privacy, and Terms links measure
22–26 px high, and Terms is 42.5 px wide. They miss the required 44×44 CSS px
touch target minimum. Its footer also omits the required Privacy link, “Built
by Param Factory”, and version/build information that appear in the footer on
every other route. The page has a valid title, language, h1, main landmark,
visible focus treatment, and a clear return link; it simply does not meet the
site-wide interactive-target and footer contract.

**Repair:** make the 404 use the same header/footer component or give every
404 link a 44×44 minimum target and add the required footer links and build
text. Add `/not-found` to the mobile target regression and route/footer check.

## Game and demo evidence

- `/demo` showed the persistent **Demo — sample data, nothing is saved** label,
  Reset demo, and Start for real. Reset restored the deterministic sample; no
  Couch Crew local-storage key was written in demo mode.
- A deterministic correct demo run reached **The crew cleared the route** with
  **48 correct moves · 0 misses**. A wrong-input run reached **Pressure reached
  100**. Replay restored the seeded `4 / 12` Dispatcher sample state.
- Pointer and number-key input advanced the route. `P` opened a modal pause
  dialog, focused Resume, made the deck inert, and returned focus on resume.
  Calm pressure and an unfinished real run survived reload.
- A fresh host and a separate 390×844 phone joined an anonymous four-letter
  room. The phone received only its assigned role controls and the host showed
  the joined-phone count.
- The service worker controlled `/demo`; after first visit an offline reload
  retained the live mission and displayed the offline notice. Reduced-motion
  checking found no running game-console animation.

## Registered claim commands

After `npm ci`, every exact command declared in `.factory/claims.json` passed
from a clean checkout. The aggregate `npm test` also passed: unit 8/8,
realtime 3/3, deployment policy 3/3, browser 19/19, and the isolated frame
test 1/1. Its frame samples were 60.00, 60.00, 60.00, 60.00, and 60.01 fps;
median 60.00 fps.

| Claim | Result | Evidence |
| --- | --- | --- |
| complete-run | PASS | Win screen; 48 correct moves |
| session-length | PASS | Deterministic paced run asserts ≥14 min and representative 17–18 min |
| assist-mode | PASS | Calm pressure grows more slowly |
| restart-reset | PASS | Loss replay restores deterministic sample |
| touch-keyboard | PASS | Pointer and number key each advance route |
| crew-size | PASS | All role assignments asserted for crews 3, 4, 5, and 6 |
| phone-controllers | PASS | Separate host and phone contexts; assigned phone controls |
| settings-persist | PASS | Calm pressure and locked unfinished move survive reload |
| demo-isolated | PASS | Demo writes no Couch Crew local-storage keys |
| local-privacy | PASS | Demo request log is same-origin only |
| real-local-privacy | PASS | Real flow allows only the product socket and same-origin assets |
| offline-reload | PASS | Fresh service-worker context reloads `/demo` offline |
| free-no-account | PASS | No credentials, purchase, or checkout controls |
| fixed-timestep | PASS | Exported simulation rate is 60 Hz |
| rendered-frame-rate | PASS | 390 px median is 60.00 fps |
| origin-policy | PASS | Local hostile origin rejected; production probe returned 403 |
| rate-limits | PASS | Production: openings 1–8 101, 9 429/Retry-After 60; health 1–60 200, 61 429/Retry-After 60 |
| recovery-deletion | PASS | Both terminal states delete the recovery key |
| no-chat | PASS | No chat control or message input |

## Live, privacy, accessibility, and routes

- `/`, `/demo`, `/controller`, `/privacy`, and `/terms` passed live Playwright
  axe scans with no serious or critical finding. The standalone axe CLI could
  not launch because this environment has Playwright Chromium but no system
  Chrome; the Playwright axe integration is the accessibility evidence used.
- `/opt/fleet/lib/verify-url.sh` passed on `/`: HTTP 200, 626 ms network-idle
  load, title, `lang=en`, one h1, one main, no missing image alt text, no
  unlabeled buttons, and no browser console or page error.
- Normal routes had no horizontal overflow at 390 px and their tested links,
  buttons, selects, and inputs met 44×44 px. The 404 exception is the finding
  above.
- Live requests during demo were same-origin. Real play used only same-origin
  content plus `wss://sf-couch-crew-realtime.sociobot.in`; no analytics,
  advertising, third-party script, or remote font was observed.
- The live service rejected `Origin: https://attacker.example` with 403. Its
  actual allowance was 8 room openings and 60 health checks per client per
  minute; the following requests returned 429 with `Retry-After: 60`.
- `/`, `/demo`, `/controller`, `/privacy`, `/terms`, robots, and sitemap
  returned 200. The deliberately missing route returned a designed HTTP 404.
  The 404 navigation response is expected; its browser resource message was
  not counted as a console defect.

## Build and deployment evidence

- `npm ci`, `npm audit --omit=dev`, `npm run lint`, `npm run typecheck`,
  `npm test`, and `npm run build` passed. The build created `dist/`.
- Output is 26.80 kB JS (9.29 kB gzip) and 18.79 kB CSS (5.00 kB gzip).
- Local/live SHA-256 pairs matched for HTML, JS, CSS, and `sw.js`:
  `c6b5367e…`, `5c53a641…`, `c5ddbafd…`, and `ed94e42b…` respectively.
- Live headers include HSTS, CSP with only the product socket in `connect-src`,
  `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and a
  restrictive permissions policy.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| No phone roles or real room service | PASS: independent desktop host and phone controller passed live |
| Game below a landing wall | PASS: live command deck is in the first desktop and phone screen |
| Intermittent complete/replay or frame tests | PASS: full clean `npm test` passed, including 19/19 browser and 60 fps performance test |
| Missing server origin/rate limits and build identity | PASS: hostile origin 403, exact 8/60 429 behavior, health reports build id |
| Missing claim coverage for save deletion, no chat, privacy, and limits | PASS: 19 claims have exactly one tagged regression and each command passed |
| Duplicate landmarks, dialog focus, home focus, and normal-route mobile targets | PASS: live axe/dialog/focus/mobile regressions passed |
| Unknown route returned 200, sitemap omitted controller, stale copy audit | PASS: real 404 returns 404, sitemap includes controller, current audit matches first-screen wording |
| First screen omitted people in one room | PASS: exact audience sentence is visible before scrolling |
| 404 route structure and mobile targets | FAIL: newly verified gap described above |

## Required next step

Repair the static 404 page and its regression coverage, deploy it, then repeat
the 390 px 404 touch-target/footer check. This review cannot pass until that
one finding is closed.
