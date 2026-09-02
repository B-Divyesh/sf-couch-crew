# Couch Crew

Play a three-mission cooperative heist with 3–6 friends on one shared screen. Each player handles a different two-button job. A complete run needs 48 correct moves and is designed for one 18-minute couch session.

Couch Crew is for friends who want coordinated action instead of trivia or competitive microgames. It runs in a browser with touch controls or number keys. There are no accounts, ads, payments, or third-party runtime services.

Live site: <https://couch-crew.sociobot.in>

One-click sample: <https://couch-crew.sociobot.in/demo>

## Play

1. Choose 3–6 players.
2. Give each player the role shown beside their controls.
3. Start the mission and call out each next move.
4. Press the matching role action before pressure reaches 100.
5. Clear Garage exit, Skybridge, and Vault run.

Touch and number-key controls both work. Keys `1` through `0` match the ten visible buttons. Press `P` to pause. Calm pressure slows the alarm for groups that want more time.

The current v1 uses one shared large touch screen or keyboard. Separate phones cannot join the same room yet. A product-owned signalling service is the next step for that part of the researched brief.

## Demo sandbox

Open `/demo` from a clean browser. The sample has five assigned players and starts partway through Garage exit. Demo actions do not write Couch Crew keys to local storage. Use **Reset demo** for the same clean seed, or **Start for real** to leave the sandbox.

The service worker caches the game shell on the first visit. The demo then reloads without a network connection.

See [.factory/demo.md](.factory/demo.md) for verifier details and [.factory/claims.json](.factory/claims.json) for the test behind each product claim.

## Develop

Requirements: Node.js 22 and npm.

```sh
npm install
npm run dev
```

Vite prints the local URL. No environment variables or external services are needed.

## Test and build

```sh
npm test
npm run build
```

`npm test` runs the deterministic core suite and Playwright browser suite. The browser suite covers the complete run, replay, storage, offline reload, privacy, keyboard, touch, mobile width, and automated accessibility checks.

`npm run build` writes the static deploy to `dist/`. The deploy root contains `index.html`, the service worker, fallback 404 page, metadata, and responsive art.

## Data and privacy

Real mode stores settings, aggregate run progress, and an unfinished run in local storage. Demo mode stores no game data. The game makes only same-origin requests and includes no analytics.

Read the in-product `/privacy` and `/terms` pages for visitor-facing details.

## Art and license

The night-road scene was generated for Couch Crew with the factory image model. Its prompt, review, and provenance are in `assets/src/` and [.factory/design.md](.factory/design.md). Interface marks and game graphics are original CSS shapes.

Code and original project assets are available under the [MIT license](LICENSE).
