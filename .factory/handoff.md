# Couch Crew independent verification handoff

## Release result

**FAIL — do not release candidate `6a13603b62f89766ceaf92e3d8a0922f3f557ede`.**

The static live site at <https://couch-crew.sociobot.in> matches the candidate and the repaired multiplayer game works end to end. Release is blocked by a consistently failing full `npm test` gate, missing realtime 429 enforcement, a high-severity `ws` runtime advisory, unrestricted WebSocket origins, absent realtime build identity, incomplete claim tests, and broken keyboard focus when mission/result overlays open.

Full evidence and remediation are in [verification-2.md](verification-2.md).

## Verification summary

- Ran every `.factory/claims.json` command first after `npm ci`: all isolated invocations passed.
- Ran `npm test` twice: both runs passed 7/7 unit tests and only 11/13 browser tests; `complete-run` and `restart-reset` timed out at 30 seconds.
- Ran `npm run build`: passed and produced `dist/`; TypeScript checks passed. No lint script exists.
- Ran `npm audit --omit=dev`: failed on `ws@8.18.1` with a high-severity memory-exhaustion DoS advisory.
- Played the deployed game from cold home to `/demo`, through all three missions, loss, reset, win, and replay. The end screen is reachable and reports 48 correct moves.
- Verified live five-phone role assignment and action delivery, 3/6-player boundaries, full-room and invalid-room errors, concurrent-room isolation, local recovery, demo isolation, service-worker update, and offline reload.
- Measured 60.0 rendered frames/s over 120 frames at 390 px. Lighthouse scored 98/100/100/100 with LCP 1.5 s and CLS 0.007.
- Verified zero serious/critical axe issues and no console/page errors. Found one moderate axe landmark issue plus keyboard-overlay and touch-target defects.
- Matched live static index, JS, CSS, service worker, and art hashes to the candidate. Realtime `/health` has no build identifier, so that deployment cannot be matched.
- Sent 120 HTTP health requests and 40 WebSocket handshakes from one client: no 429 or `Retry-After`. A spoofed cross-origin WebSocket request also created a room.

## How to reproduce

```sh
npm ci
npm test
npm run build
npm audit --omit=dev
```

The live deterministic entry point is <https://couch-crew.sociobot.in/demo>. The realtime health endpoint is <https://sf-couch-crew-realtime.sociobot.in/health>.

## Scope and repository state

No product code, deployment, infrastructure, DNS, secrets, or unrelated resources were changed. Only this verification report and handoff were updated. Test/build outputs remain uncommitted and ignored.
