# Couch Crew

Play a three-mission cooperative heist with 3–6 friends or family members in one room. Open the shared command screen, then each phone joins its four-letter room for a different two-button job. A paced run needs 48 correct moves, lasts at least 14 minutes, and targets an 18-minute couch session.

Couch Crew is for friends who want coordinated action instead of trivia or competitive microgames. It runs in a browser with phone controls, touch controls, or number keys. There are no accounts or payments.

Live site: <https://couch-crew.sociobot.in>

One-click sample: <https://couch-crew.sociobot.in/demo>

## Play

1. Open the game on a shared screen and choose 3–6 players.
2. Friends open `/controller` on their phones and enter the four-letter room code.
3. Each phone receives its assigned role controls.
4. Press the called role action before pressure reaches 100.
5. Clear Garage exit, Skybridge, and Vault run.

Touch and number-key controls both work. Keys `1` through `0` match the ten visible buttons. A correct move locks immediately, then the next call arrives on the 17.5-second beat. Press `P` to pause. Calm pressure slows the alarm for groups that want more time.

The host screen also keeps all ten controls as a touch and keyboard fallback. Phone rooms are anonymous and contain no chat or accounts. The host game uses a fixed 60 Hz simulation timestep and renders at 60 frames per second on a 390 px screen.

## Demo sandbox

Open `/demo` from a clean browser. The sample has five assigned players and starts partway through Garage exit. Demo actions do not write Couch Crew keys to local storage. Use **Reset demo** for the same clean seed, or **Start for real** to leave the sandbox.

The service worker caches the game shell on the first visit. The demo then reloads without a network connection.

See [.factory/demo.md](.factory/demo.md) for verifier details and [.factory/claims.json](.factory/claims.json) for the test behind each product claim.

## Develop

Requirements: Node.js 22 and npm.

```sh
npm install
npm run realtime
```

In a second terminal:

```sh
npm run dev
```

Vite prints the local URL. The local room service listens on port 8787. No environment variables or third-party services are needed.

## Test and build

```sh
npm test
npm run build
```

`npm test` runs the deterministic core, room service, deployment policy, and browser suites. Functional browser checks use two workers. The repeated frame-rate measurement runs afterward in one isolated worker so browser contention cannot change the result.

`npm run build` writes the static deploy to `dist/`. The deploy root contains `index.html`, the service worker, fallback 404 page, metadata, and responsive art.

## Deploy

Publish `dist/` as the static site root with its included `staticwebapp.config.json`. Build `realtime/Dockerfile` from the `realtime/` directory, expose port 3000, and deploy it as the product-owned `sf-couch-crew-realtime` service. Production browsers connect only to `wss://sf-couch-crew-realtime.sociobot.in`.

## Data and privacy

Real mode stores settings, aggregate run progress, and an unfinished run in local storage. Demo mode stores no game data. Phone rooms send only room signals and button presses to Couch Crew’s own WebSocket service. Real play loads no analytics, advertising, or third-party scripts. The demo makes no third-party requests.

The room service accepts browser connections only from Couch Crew and local development origins. It allows eight opening WebSocket connections and 60 health checks per client each minute. Extra requests receive `429 Too Many Requests` with `Retry-After`.

Read the in-product `/privacy` and `/terms` pages for visitor-facing details.

## Art and license

The night-road scene was generated for Couch Crew with the factory image model. Its prompt, review, and provenance are in `assets/src/` and [.factory/design.md](.factory/design.md). Interface marks and game graphics are original CSS shapes.

Code and original project assets are available under the [MIT license](LICENSE).
