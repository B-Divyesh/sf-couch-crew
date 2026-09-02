# Couch Crew repair handoff

## Release result

The three independent-verification blockers are repaired and deployed to <https://couch-crew.sociobot.in>.

- The host creates a product-owned anonymous four-letter room over `wss://sf-couch-crew-realtime.sociobot.in`. Every joining phone uses `/controller?room=CODE` and receives only its assigned role controls. The sixth player shares dispatcher controls. Rooms are in-memory and expire after 30 minutes; no account, name, or analytics is collected.
- `/` now opens directly on the live host command deck. The deck appears in the cold desktop and 390 px viewport; the sample mission remains at `/demo`.
- The replay claim test stops when the loss overlay appears, uses the normal visible controls to restart, and completes all three missions after the reset.

The deterministic 60 Hz core, three-mission campaign, keyboard/touch fallback, offline demo, demo isolation, and real-mode local recovery are preserved.

## Realtime deployment

- Created Container Apps environment `sf-couch-crew-realtime-env` and product service `sf-couch-crew-realtime` in `sociobot`.
- Bound the product-owned TLS hostname `sf-couch-crew-realtime.sociobot.in`; `GET /health` returns `{"service":"couch-crew-realtime","rooms":0}`.
- The static app CSP permits only that WebSocket origin in addition to its own origin. The room service is the only non-static product endpoint.

## Verification

Run locally after a clean install:

```sh
npm ci
npm test
npm run build
```

Evidence from this repair:

- `npm ci` completed, then `npm run test:unit` passed 7/7.
- Browser claim coverage passed in clean Playwright shards: complete-run/restart passed 2/2, and the remaining claim/accessibility/mobile shard passed 11/11. The final focused rerun passed restart, phone-controller, and cold-screen coverage 3/3.
- The fixed restart regression goes loss → **Try this run again** → all 48 visible correct actions → **The crew cleared the route**.
- `npm run build` passed. Final initial JS is 25.71 KB raw / 8.90 KB gzip and CSS is 18.47 KB raw / 4.94 KB gzip.
- Playwright axe checks found no serious or critical violations across home, demo, controller, privacy, and terms. Mobile 390 px has no horizontal overflow. The live desktop + 390 px and two-browser phone-room test passed against the production URL.
- Lighthouse 12.2.1’s generated report scored Performance 100 and Accessibility 100. Chrome reported a late BFCache tab-crash warning after report generation; the report is not used for a Best Practices claim.
- Live checks confirmed the deployed JS hash reference, static CSP, HTTPS 200, WebSocket room creation, secured custom hostname, and `/health` identity.

## Deployment

Static output was deployed from `dist/` to the existing `sf-couch-crew` Static Web App. The WebSocket service was built from `realtime/Dockerfile` and deployed to `sf-couch-crew-realtime`. No other product resources were read or changed.

## Known gaps

None known. The realtime room state is intentionally ephemeral rather than stored: it contains only anonymous active sockets and is discarded on room close or expiry.
