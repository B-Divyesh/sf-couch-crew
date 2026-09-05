# Couch Crew review 2 handoff

## Status

**FAIL — one medium finding and zero untested public claims.**

Implementation reviewed:
`1f6b13e49dac4f200c4b625245e92371a9401f2c`.
Prior documentation baseline:
`470ec02204990f3845cf034456a56a8087cdbedf`.
Review starting head:
`4d4ac232f535c942f7ba7543fe39dcaeb0b20a0b`.

No product code was changed. See `.factory/review-2.md` for the full evidence.

## Finding to repair

The room backend correctly returns HTTP 429 with `Retry-After` after eight
WebSocket openings, but a rate-limited phone remains on **Joining room…**. It
does not say that the join failed or when to retry. This was reproduced on the
live 390 px controller and recorded at
`/work/.evidence/review-2/live-controller-rate-limit.png`.

Handle a controller socket that closes before the `joined` message. Show a
plain retry message, keep **Join room** available, and add a production-like
rate-limit UI regression. Then deploy and repeat the boundary plus successful
post-reset join.

## What passed

- All 19 exact claim commands passed from a clean detached checkout after
  `npm ci`; there are zero untested public claims.
- `npm audit --omit=dev`, lint, typecheck, the consolidated `npm test`, and
  build passed. `dist/` was produced.
- Fresh local and live hashes match for HTML, JavaScript, CSS, service worker,
  and art. Live runtime is the reviewed implementation.
- Fresh desktop and 390 px phone first screens showed the job, room audience,
  sample action, and playable command deck before scrolling.
- Demo label, realistic seeded state, reset, real-storage isolation, offline
  reload, settings persistence, keyboard/touch, pause focus, reduced motion,
  and win/loss/replay all passed.
- A live correct run ended at 48 moves and zero misses. A live wrong-input run
  reached pressure 100.
- One host and five independent phones received all five roles. A phone action
  locked the host move; a disconnected phone rejoined the same room.
- Live axe checks passed all routes and the real 404. The URL verifier passed.
  Lighthouse mobile scored 100 in Performance, Accessibility, Best Practices,
  and SEO; LCP was 1.5 s and CLS 0.007.
- The room service rejected a hostile Origin with 403. It allowed eight socket
  openings and 60 health requests, then returned 429 with `Retry-After`.

## Verification commands

```text
npm ci
npm audit --omit=dev
npm run lint
npm run typecheck
# run every test command in .factory/claims.json
npm test
npm run build
```

The review report is also copied to `/work/.evidence/qa-report.md`. The machine
result is `/work/.evidence/qa-result.json`.
