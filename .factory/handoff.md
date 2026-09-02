# Couch Crew independent verification handoff

## Release result

**FAIL — do not release candidate `07fec1d909849b67792ea1b34f973030acd615a3`.**

Independent verification ran on 2026-09-02 against <https://couch-crew.sociobot.in> for work order `couch-crew-verify-3`. The deployed game is functional and matches the candidate's runtime files, but the mandatory full quality gate fails consistently and the strict first-read/claims contracts are not met. Full evidence is in [`.factory/verification-3.md`](verification-3.md).

## Release blockers

- `npm test` failed twice at 15/16 browser tests. `@claim:rendered-frame-rate` measured 31.3166 and 32.9038 fps under the committed two-worker suite, below its 50 fps minimum. Isolated and live samples pass, so the benchmark is concurrency-sensitive, but the required gate remains red.
- The first screen says “3–6 phones” and never plainly identifies “friends in one room.” The one-click sample and live game are present, but the mandatory audience test fails.
- `session-length` proves only the sum of maximum response windows, not an 18-minute completed session. `crew-size` claims 3–6 players but its registered test checks only six.
- README/privacy/landing claims about origin restriction, exact rate allowances, recovery-save removal, and no chat are absent from `.factory/claims.json`.

## Other defects

- SPA navigation back to `/` leaves focus on `<body>` instead of the home `h1`.
- Mobile footer links are 21.1 px high; Terms is 40 px wide, and the top Demo link measured 43.7 px wide. The baseline is 44×44 px.

## What passed

- After `npm ci`, all 15 exact claim commands pass in isolation.
- `npm run build` passes and produces `dist/`; TypeScript passes. There is no lint script.
- `npm audit --omit=dev` reports zero vulnerabilities.
- A live scripted run crosses all three missions and reaches the real win screen at 48 correct moves. The loss screen, both replay paths, touch, keyboard, pause, persistence, progress, Calm pressure, sound, and Screen nudge work.
- Live rate limits enforce 8 WebSocket handshakes and 60 health requests per client per minute; the next request returns 429 with `Retry-After: 60`. Hostile WebSocket origins return 403.
- Demo requests are same-origin only; real play additionally opens only the product-owned realtime socket. No ordinary-flow console or page errors were observed.
- Live axe has zero serious/critical findings on all five application routes. Reduced motion, overlay focus/inert behavior, service-worker update, and offline reload pass.
- Lighthouse mobile: 99 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.377 s, TBT 146.5 ms, CLS 0.0071.
- Live static HTML, JS, CSS, service worker, and art hashes match the fresh candidate build. Realtime health reports code ancestor `7f9637a`; later candidate commits are documentation-only.

## Run the verification gates

```sh
npm ci
npm test
npm run build
npm audit --omit=dev
```

Current expected result: build and audit pass; `npm test` fails at the parallel frame-rate test. Evidence from the latest failure is under `test-results/game-the-live-game-renders-db65c-n-claim-rendered-frame-rate-chromium/`.

## Product code changes

None. This verification changed only `.factory/verification-3.md` and `.factory/handoff.md`.
