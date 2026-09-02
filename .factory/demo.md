# Couch Crew demo sandbox

## Entry point

- Deployed: `https://couch-crew.sociobot.in/demo`
- Local: `http://127.0.0.1:4173/demo` after `npm run build && npm run preview`

## Sample data

The sample uses deterministic seed `20260902`. It contains five assigned players, all five roles, four completed Garage exit moves, 18% starting pressure, and a two-move streak. The first screen is already live and playable.

The sample deliberately uses its built-in shared controls. It never opens a phone room, so its privacy and offline checks remain independent of the live room service.

## Isolation

Demo state exists only in JavaScript memory. It does not read or write the real keys:

- `couch-crew:v1:settings`
- `couch-crew:v1:run`
- `couch-crew:v1:progress`

Service-worker Cache Storage contains public application files, not player data. The `@claim:demo-isolated` test starts with fresh browser storage, plays a move, and checks that no Couch Crew local-storage key exists.

## Reset and exit

**Reset demo** restores the deterministic seed and sample starting state. **Start for real** discards the in-memory sample and returns to real crew setup. Reloading `/demo` also restores the sample.

## Verification

Run every browser claim with:

```sh
npm run test:e2e
```

The offline claim uses its own browser context. It visits `/demo`, waits for the service worker, disables the network, reloads, and checks the live mission.
