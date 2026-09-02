# Verification report — FAIL

**Candidate:** `9d162a19d6f0c43f829490553682d84333537a6a`  
**Live URL:** <https://couch-crew.sociobot.in>  
**Verified:** 2026-09-02  
**Verdict:** **FAIL — do not release.**

## First read

Cold-loading the live site at desktop and 390 px says: “Run a heist with every friend”; “For 3–6 friends sharing one screen, each player gets a different two-button job”; and offers **Try it with sample data**. The next-action copy explains that a live mission will open. This passes the plain-words and one-click-demo first-read requirement. `/demo` opens a deterministic live mission with the persistent demo banner, Reset demo, and Start for real.

However, the cold initial viewport is a hero/landing screen, not the playable game: at 1440 x 900 it shows the hero image and the heading for the later game section; at 390 x 844 it shows the hero and only the start of that section. The actual controls are below the first viewport. This fails the browser-game requirement that the captured first screen show the game itself rather than a menu/landing wall.

## Release blockers

### High — the delivered product does not serve the researched job

The brief requires friends in one room where **every phone has a meaningful, different role**, using short room codes and anonymous ephemeral sessions. The candidate is static, has no room/session/controller endpoint, and renders all ten role buttons on one shared browser screen. The product itself documents the deviation in the live landing page and README: “This version uses one shared screen instead of separate phone connections.” A decorative local room code is not a joinable room. This is the central product constraint, not a minor enhancement.

### High — required first capture is not the game

See the first-read evidence above. The initial desktop and mobile view shows marketing/setup before playable controls, contrary to the explicit game-lane capture requirement.

### Blocker — full clean test suite fails a registered claim test

After `npm ci`, `npm test` produced **6/6 unit tests passed, 10/11 Chromium tests passed, 1 failed**. The failing test is the registered `@claim:restart-reset` claim (`tests/e2e/game.spec.ts:21`):

```
Test timeout of 30000ms exceeded.
locator.click: ... <aside class="demo-banner"> intercepts pointer events
... <h2>Pressure reached 100</h2> ... intercepts pointer events
```

The test keeps issuing wrong-role clicks after the loss overlay appears, so the target is no longer clickable. An isolated invocation happened to pass, but the full clean run is not reproducible. The factory claims rule treats any failed claim test as release-blocking.

## Claim commands

Every command declared in `.factory/claims.json` was invoked from the freshly installed candidate. The isolated runs passed for `complete-run`, `session-length`, `assist-mode`, `restart-reset`, `touch-keyboard`, `crew-size`, `settings-persist`, `demo-isolated`, `local-privacy`, `offline-reload`, and `free-no-account` (one first `free-no-account` attempt also encountered a refused local preview connection). The authoritative full `npm test` rerun failed `restart-reset` as described above, therefore the claim gate is **FAIL** regardless of its intermittent isolated pass.

## What passed

- `npm ci` completed with zero audit vulnerabilities.
- `npm run build` passed (`tsc --noEmit && vite build`) and produced `dist/`. Built JS is 22,201 bytes (7.90 KB gzip); CSS is 15,085 bytes (4.30 KB gzip).
- The live JS, CSS, and service worker SHA-256 hashes exactly match the fresh `dist/` output:

  ```
  JS  2e2e2bd4be3b566e984403e373d95f782f6f85ae3f2e0978abf8077e566f0c9a
  CSS aea5745d590a54912fcf7c5048c305b78aeb3090babdd682ee106b89017e50a9
  SW  3bddd495287d90a4d60393e82d4c7af20c180869d198c77220aad5c5be0ec56b
  ```

- Production scripted play at `/demo` reached **The crew cleared the route** after all three missions and showed `48 correct moves · 0 misses`.
- A production loss was reached after 14 wrong moves. **Try this run again** reset the demo to `4 / 12` and restored the original called role.
- Real-mode settings and unfinished-run recovery passed their browser claim test. Touch, number keys, 3–6 role assignment, calm pressure, and offline reload claims passed in the full run except for the unstable restart test.
- Production `requestAnimationFrame` sampling at 390 px measured 120 frames in 2009.5 ms (59.72 fps). This is observational evidence only; there is no registered frame-rate claim test required by the game-loop contract.
- Live desktop and 390 px mobile had no horizontal overflow. The first Tab reached the skip link with a visible `rgb(88, 231, 242) solid 3px` outline. Reduced-motion mobile evaluation found zero active CSS animations.
- Fresh live axe scans of `/`, `/demo`, `/privacy`, and `/terms` found no serious or critical violations; each had one `h1` and one `main`.
- No live page or console errors were observed. Demo request logging recorded only same-origin document, JS, CSS, and original image requests; there were no third-party requests. The live CSP restricts scripts, connections, and workers to `self`, and the response has HSTS, `nosniff`, referrer policy, and permissions policy headers.
- `/`, `/demo`, `/privacy`, and `/terms` returned 200; the designed `/404` returned 200 through the configured 404 rewrite. Hashed JS is cached `max-age=31536000, immutable`.
- Service worker registration has active/controller `/sw.js`; calling `registration.update()` resolved with no waiting worker. In an isolated context, `/demo` reloaded offline and displayed both the game heading and “You’re offline. This run still works.”

There are no server-side product endpoints in this static deployment, so a request-rate allowance / 429 check is not applicable. There is no sign-in.

## Required remediation

1. Deliver the product-owned short-lived room service and per-phone controller routes (or explicitly change the accepted brief before release). Verify multi-device role ownership and room/session isolation end to end.
2. Put a real playable command screen in the initial capture viewport on both desktop and 390 px, rather than only a landing hero and preview.
3. Repair `@claim:restart-reset` so it stops input once loss is visible and passes consistently as part of `npm test`; add the required deterministic frame-rate claim/test as well.

