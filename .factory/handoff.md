# Couch Crew repair 5 handoff

## Status

**PASS — the review 2 rate-limit recovery finding is resolved. No known gaps remain.**

Implementation commit:
`c0270e1d820bc623cfcb689cdc75c434ae228799`.

The static site and room service both run this implementation. The live room
service reports the full implementation SHA from `/health`. Documentation after
that implementation commit records verification only.

## What changed

- A controller socket that errors or closes before `joined` now leaves the
  pending state and says: **The room service is busy. Wait one minute, then
  join again.**
- The controller keeps **Join room** enabled. A new attempt replaces the failed
  socket, while late close events from an older attempt cannot overwrite the
  current status.
- `@claim:rate-limit-recovery` drives the real room server through its eighth
  accepted opening, checks the phone result after the rejected opening, moves
  the same one-minute allowance window forward, and joins the same live room.
- The room server accepts an injected clock only in tests. Its production
  allowance and protocol are unchanged.

## Clean verification

A detached checkout of the implementation ran the documented setup with
Node.js 22:

```text
npm ci                                      PASS (0 vulnerabilities)
all 20 exact commands in claims.json        PASS
npm audit --omit=dev                        PASS
npm run lint                                PASS
npm run typecheck                           PASS
npm test                                    PASS
npm run build                               PASS; dist/ created
```

The consolidated suite passed 8 unit tests, 3 realtime tests, 3 deployment
policy tests, 21 browser tests, and the isolated frame test. The browser test
uses a 390 px phone, the production opening count, and the production one-minute
window. Initial output is 27.06 kB JavaScript (9.41 kB gzip) and 18.79 kB CSS
(5.00 kB gzip). Frame samples were 60.00, 60.00, 60.01, 60.00, and 60.00 fps;
median 60.00 fps.

## Live verification

- Fresh 1366×900 desktop and 390×844 phone contexts showed the job, audience,
  **Try it with sample data**, and live command deck before scrolling.
- One click opened the seeded demo at `4 / 12`. One move reached `5 / 12`;
  Reset demo restored `4 / 12`; the persistent demo label remained; existing
  real storage was unchanged.
- A correct run reached **The crew cleared the route** with 48 correct moves.
  A wrong-input run reached **Pressure reached 100**. Both end screens and the
  restart actions rendered correctly.
- Five independent phone contexts received Driver, Lookout, Hacker, Loader,
  and Dispatcher. A called phone action locked the host move. Driver disconnected
  and rejoined the same room before the rate boundary.
- The next excess live socket returned HTTP 429 with `Retry-After: 58`. A fresh
  phone showed the new retry message and kept Join room enabled. After that
  exact window, the phone joined the same room and the host returned to five
  connected phones.
- The live health endpoint allowed 60 requests, then returned 429 with
  `Retry-After: 60`. A hostile WebSocket Origin returned 403.
- Settings and an unfinished move survived reload. Pause moved focus into its
  dialog, made background controls inert, and returned focus. Reduced-motion
  mode exposed zero running animations.
- The service worker controlled `/demo`, had no waiting update, and reloaded
  the playable demo offline.
- `/`, `/demo`, `/controller`, `/privacy`, and `/terms` returned 200. The
  deliberate `/not-found` returned its designed 404. Tested routes had their
  own titles, one h1, one main, no horizontal overflow, no serious or critical
  axe result, and no visible target below 44×44 px.
- The URL verifier passed with no console or page errors. Lighthouse mobile
  scored 100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO;
  FCP was 0.90 s, LCP 1.50 s, TBT 26 ms, CLS 0.0069, and transfer 120.75 kB.
- Live HTML, JavaScript, CSS, service worker, and all three production art files
  match the fresh `dist/` output by SHA-256.

## Deployment

- Static Web App `sf-couch-crew` deployed successfully from `dist/` with its
  durable production configuration and custom HTTPS domain.
- Container App `sf-couch-crew-realtime` runs image tag
  `c0270e1d820b`, revision `sf-couch-crew-realtime--0000006`, with one healthy
  active replica and `minReplicas: 1`, `maxReplicas: 1`. This keeps anonymous
  in-memory rooms on one process.
- The generic container wrapper first built the image in a registry not used by
  this existing app, so its PATCH failed before creating a revision. The image
  was rebuilt under the app's existing product image name, deployed, and the
  failed attempt left no active revision or runtime change.

## Earlier findings

| Finding | Current disposition |
| --- | --- |
| No real rooms or phone-specific roles | Resolved: five independent live phones received all roles and controlled the host. |
| Game hidden below a landing wall | Resolved: the command deck is in the first desktop and phone screens. |
| Unstable complete, replay, or frame tests | Resolved: the clean consolidated suite passes; live median is 60.00 fps. |
| Vulnerable dependency, missing origin checks, limits, or identity | Resolved: audit is clean; live 403, exact 8/60 allowances, Retry-After, and build identity pass. |
| Incomplete claims | Resolved: 20 claims each have exactly one tagged outcome regression; every exact command passes. |
| Focus, landmark, touch-target, route, sitemap, and copy issues | Resolved: live route, axe, focus, 390 px, title, and 404 checks pass. |
| Incomplete 404 footer and targets | Resolved: the designed live 404 has the required footer and 44 px targets. |
| Demo could change real storage | Resolved: live before/after storage snapshots are identical. |
| Phone stuck on “Joining room…” after 429 | Resolved: live phone shows retry guidance and joins the same room after reset. |

## Evidence

Evidence is under `/work/.evidence/couch-crew-repair-5/`, including desktop and
phone first screens, win and loss screens, rate-limit and successful-retry phone
screens, URL-verifier output, and Lighthouse JSON. The catalog description is
also copied to `/work/.evidence/catalog-description.txt`.

## Known gaps and next steps

None for this work order.
