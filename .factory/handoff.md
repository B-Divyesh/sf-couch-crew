# Couch Crew verification 5 handoff

## Status

**PASS — independently verified on 2026-09-05. No known gaps remain.**

Implementation SHA: `1f6b13e49dac4f200c4b625245e92371a9401f2c`.
The prior static 404 repair is `d0b5832490c21d1b318676a4f4095b63e0128b2a`.
The verification documentation baseline is `470ec02204990f3845cf034456a56a8087cdbedf`. This handoff and the final QA report are committed separately after implementation, so documentation SHAs differ from the implementation SHA.

## Verification 5

- Fresh `npm ci`, audit, lint, typecheck, all 19 declared claim commands, `npm test`, and `npm run build` passed. The final isolated 390 px frame-rate median was 60.00 fps.
- Fresh desktop and 390 px phone browsers showed the job, audience, sample action, and active game deck before scrolling. The live demo label, reset, win, loss, replay, real-storage isolation, phone controller, offline reload, keyboard focus, reduced-motion behavior, legal routes, and privacy behavior passed.
- Live axe, the URL verifier, all 390 px targets, and the designed HTTP 404 passed. The 404 has the full footer and 44 px links.
- The room service rejected a hostile origin with 403. It accepted 8 room openings then returned 429/`Retry-After: 60`; it accepted 60 health requests then returned the same allowance response. A clean desktop-host/phone-controller run passed after the intentional limit probe expired.
- Fresh build/live hashes match for HTML, JavaScript, CSS, service worker, and all original art assets. See `.factory/verification-5.md` for full evidence.

## What changed

- Rebuilt the real static 404 shell with plain recovery text, the standard
  header links, and the complete product footer: Privacy, Terms, Built by
  Param Factory, and version/art provenance.
- Made every visible 404 link at least 44 by 44 CSS px on a 390 px phone.
- Added route metadata to the standalone 404 page and kept the designed HTTP
  404 response rather than turning it into a 200 response.
- Added an outcome-based browser regression for `/not-found`: it requires HTTP
  404, the complete footer, no horizontal overflow, and 44 px touch targets.
  Automated axe coverage and the mobile target regression now include the real
  not-found route.
- Replaced local preview with a small static-server equivalent that honors the
  production public route rewrites and real 404 fallback. This lets browser
  tests exercise `/not-found` as a 404 locally.
- Fixed an isolation edge found during live verification: entering demo mode no
  longer re-saves an unfinished real run. The expanded `demo-isolated` claim
  proves a direct demo writes no product keys and a demo/reset flow leaves an
  existing real-storage snapshot unchanged.
- Added `.factory/catalog-description.txt` and copied the verb-first catalog
  description to `/work/.evidence/catalog-description.txt`.

## First screen

- Job: coordinate a three-mission cooperative heist from different phones.
- Audience: 3–6 friends or family members in one room.
- First action: **Try it with sample data**. It opens an active seeded mission.

Fresh 1366×900 desktop and 390×844 phone contexts showed the headline,
audience sentence, exact sample action, and active game deck before scrolling.
The live captures were visually reviewed.

## Verification

Clean setup began with `npm ci` (zero audit vulnerabilities). Every one of the
19 exact commands in `.factory/claims.json` passed on the final implementation.
The consolidated final gates also passed:

```text
npm run lint       PASS
npm run typecheck  PASS
npm audit --omit=dev  PASS (0 vulnerabilities)
npm test           PASS
npm run build      PASS
```

`npm test` passed 8 unit tests, 3 realtime tests, 3 deployment-policy tests,
20 browser tests, and the isolated performance test. The final 390 px samples
were 60.01, 60.01, 60.00, 60.00, and 60.00 fps (median 60.00 fps). The build
creates `dist/`; initial JavaScript is 26.83 kB (9.29 kB gzip) and CSS is
18.79 kB (5.00 kB gzip).

## Live deployment and checks

The final `dist/` was deployed with the product's existing static deployment.
The live JavaScript hash matches the local final build:

```text
46b1adf42500e147164caa7e8894a8119bafd66b963e8ec842beb998c3b55565
```

- `verify-url.sh` on the live home page passed: HTTP 200, 665 ms load, correct
  title and language, one h1, main landmark, zero missing alt text, zero
  unlabeled buttons, and zero page/console errors.
- Live Playwright axe checks passed on home, demo, controller, privacy, terms,
  and the real 404 route with no serious or critical issues. The live 404
  mobile/footer regression also passed.
- The live 404 returned HTTP 404, rendered **Page not found**, had no horizontal
  overflow at 390 px, and all visible links/buttons measured at least 44 px in
  each dimension. Its expected browser resource message for a 404 navigation is
  classified as an expected HTTP status, not a page defect.
- Live demo opened at `4 / 12`, showed the persistent sample label, advanced to
  `5 / 12`, reset to `4 / 12`, reached both the win and loss end screens, and
  replayed to `4 / 12`. It left the pre-existing real local-storage snapshot
  unchanged.
- A fresh desktop host and independent 390 px phone completed the live
  phone-controller claim. The product-owned room service health endpoint is
  unchanged and reports build `e2d48b7435badb3b64b6daabc540da3d2550a1e4`.
  Its live health allowance accepted 60 requests; the next returned HTTP 429
  with `Retry-After: 53`.

## Earlier findings

All findings in the prior verification history remain resolved. Review 1's
sole outstanding medium finding (the static 404 mobile targets and incomplete
footer) is resolved by this release. No known gaps remain.
