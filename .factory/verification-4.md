# Independent verification report — PASS

**Candidate:** `0d27a4dcc8aa26cae50df8c5629046f03f73c2ae`  
**Live URL:** <https://couch-crew.sociobot.in>  
**Verified:** 2026-09-02  
**Work order:** `couch-crew-verify-4`

## Verdict

**PASS — release accepted.** No release-blocking defects were found.

The current live static output is the candidate: local and deployed `index.html`,
`assets/index-CEXxauC6.js`, and `assets/index-DFGNzanM.css` have identical
SHA-256 values. The room service health endpoint reports build
`e2d48b7435badb3b64b6daabc540da3d2550a1e4`, which is the code-changing
ancestor (`e2d48b7`); commits through the candidate change only release/docs
evidence after the static repair.

## Mandatory first-read and demo gates

A fresh desktop context loaded `https://couch-crew.sociobot.in/` with HTTP 200
and immediately showed the actual command deck at route `0 / 12`, not a menu
wall. The first viewport plainly says:

- “Coordinate a heist from every phone” — what it does.
- “For 3–6 friends or family members in one room…” — who it is for.
- “Try it with sample data” — what to click first.

The first screen also states anonymous rooms, free/no account, keyboard
fallback, three missions, and about 18 minutes. The one-click demo opens
`/demo`, presents the persistent “Demo — sample data, nothing is saved” banner
with Reset demo and Start for real, and starts inside an active sample mission.

## Claims and local quality gates

From this clean candidate checkout, `npm ci` installed 174 packages with zero
audit findings. Before other product QA, every exact command in
`.factory/claims.json` was run from its demo entry point. All 19 registered
claims passed. The subsequent consolidated gates also passed:

```text
npm run lint                 PASS
npm run typecheck            PASS
npm test                     PASS
npm run build                PASS
```

The suite result was unit 8/8, realtime 3/3, deployment policy 3/3, browser
functional tests 19/19, and isolated 390 px frame test 1/1. The performance
test recorded a median within its claimed 50–65 fps range. `dist/` was created;
the initial app JavaScript is 26,801 bytes (9,290 gzip) and CSS is 18,785 bytes
(5,000 gzip), below the static-product budgets.

Claim coverage included complete and loss/replay terminal states, real-run
session pacing, calm-pressure assist, touch/keyboard controls, all 3–6 crew
assignments, anonymous phone roles, settings/recovery persistence, isolated
demo storage, request privacy, offline reload, no-account/free use, fixed 60 Hz
simulation, frame rate, socket origin policy, server rate limits, recovery-save
deletion, and no chat.

## Fresh live functional QA

- A scripted correct demo run reached **“The crew cleared the route”** with
  **48 correct moves · 0 misses**. A scripted wrong-input run reached
  **“Pressure reached 100”**; replay restored the seeded `4 / 12` Dispatcher
  sample state. This confirms goal, challenge, win/loss, and reset.
- A 390×844 phone joined a newly created anonymous four-character room (`53N2`),
  received exactly its Driver role controls, and the host changed to
  “1 of 5 phones joined.”
- In real mode, enabling Calm pressure and locking one move survived reload;
  local storage contained only the documented `couch-crew:v1:settings` and
  `couch-crew:v1:run` recovery keys.
- Keyboard key `0` advanced the displayed Dispatcher “Route B” action from
  `4 / 12` to `5 / 12`. First Tab focused Skip to the game with a cyan 3 px
  visible outline. `P` opened the pause dialog, placed focus on Resume, and
  made background game controls inert.
- The service worker controlled `/demo`, had no waiting update, and an offline
  reload retained the game and showed “You’re offline. This run still works.”

## Privacy, accessibility, deployment, and security

- Live request logging during demo and real play recorded only
  `https://couch-crew.sociobot.in` document/assets and the product-owned socket
  `wss://sf-couch-crew-realtime.sociobot.in`; no analytics, ads, third-party
  scripts, or fonts appeared. Demo local storage stayed empty after play.
- Axe found zero serious or critical findings on `/`, `/demo`, `/controller`,
  `/privacy`, and `/terms`. At 390 px, scroll width equalled client width
  (390 px), reduced-motion exposed no game-console animation, and no console or
  page errors occurred.
- `/opt/fleet/lib/verify-url.sh` passed live: HTTP 200, 653 ms load, title,
  `lang=en`, one h1, main landmark, no missing image alt text, no unlabeled
  buttons, and zero browser errors.
- Response headers include HSTS, CSP with self plus the product realtime origin,
  `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, and a
  restrictive permissions policy. HTML/service worker revalidate at 30 seconds;
  hashed JS/CSS are immutable for one year.
- The live realtime service rejected a deceptive hostile WebSocket Origin with
  403. It accepted openings 1–8 and returned `429` with `Retry-After: 60` on
  opening 9. A clean health-check window accepted 60 requests and the 61st
  returned 429 with `Retry-After: 58` (remaining fixed-window seconds). The
  observed allowance is therefore 8 room openings and 60 health checks per
  client per minute.

## Defects by severity

None.

