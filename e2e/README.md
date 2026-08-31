# Browser tests

Playwright tests for the board games app: one spec per game, driving two real
browser windows through a whole table — landing screen, room, join by invite
link, deal, and a turn or two.

This folder is **standalone**. It has its own `package.json`, its own
`node_modules` and its own `tsconfig.json`, and nothing in the game project
refers to it. The app's `package.json`, `vite.config.ts` and `tsconfig.json` are
untouched; delete this folder and the app is exactly as it was.

## Running

```sh
cd e2e
bun install
bunx playwright install chromium   # once; ~150MB, cached in your user profile
bun run test
```

npm works just as well if you prefer it: `npm install`, `npx playwright install
chromium`, `npm test`.

`playwright test` starts the app itself (`bun run dev` in the parent folder,
which is Vite on 5173 plus the game server on 8787) and shuts it down
afterwards. If a dev server is already up it is reused.

To test something that is already running — a built server, a deployment —
point at it and no server is started:

```sh
E2E_BASE_URL=http://localhost:8787 bun run test
```

## What runs where

Four viewports, all Chromium, so one browser download covers the suite:

| Project        | Viewport   | What it is for                               |
| -------------- | ---------- | -------------------------------------------- |
| `mobile`       | 390 × 844  | The phone layouts: sheets, tabs, touch sizes |
| `mobile-large` | 430 × 932  | The same, with room to spare                 |
| `tablet`       | 768 × 1024 | The middle layout                            |
| `desktop`      | 1440 × 900 | The full three-column tables                 |

```sh
bun run test -- --project=mobile        # one shape
bun run test -- tests/monopoly.e2e.ts   # one game
bun run test -- --headed --project=desktop
bun run report                          # the HTML report from the last run
```

Tests marked mobile-only skip themselves on the desktop project, so a full run
is honest about what it covered rather than quietly passing.

## The specs

| File                     | Game               | Beyond seating a table                            |
| ------------------------ | ------------------ | ------------------------------------------------- |
| `tests/samurai.e2e.ts`   | Samurai            | Drafts five tiles each; sidebar sheet on a phone   |
| `tests/monopoly.e2e.ts`  | Monopoly           | Throws the dice; tabs, tap-for-details, square board |
| `tests/coup.e2e.ts`      | Coup               | Takes Income and watches the turn pass            |
| `tests/halligalli.e2e.ts`| Halli Galli        | Bell on every screen, flip on exactly one         |
| `tests/carnivals.e2e.ts` | Carnivals          | Bank and hand are dealt                           |
| `tests/cop.e2e.ts`       | COP                | Exactly one seat is the Cop                       |
| `tests/snake.e2e.ts`     | Snake              | One arena, live on both screens                   |
| `tests/ladders.e2e.ts`   | Snakes & Ladders   | Rolls the die and passes the turn                 |

`support/table.ts` holds what every game does the same way: host, join, start,
and the two checks every screen owes a phone (no sideways scroll, no button too
small to hit).

## Two things worth knowing

**The extension is `.e2e.ts`, not `.spec.ts`.** The app runs Vitest from the
repository root and its default `include` is `**/*.{test,spec}.*` — a file named
`something.spec.ts` anywhere under the repo gets swept into the unit suite and
run under jsdom, where `@playwright/test` cannot even be imported. Keep the
extension when adding specs.

**The opening roll-off is turned off when hosting.** It decides nothing — the
engine draws the seat at the deal and the ceremony is a replay of it — but it is
a two-second overlay, and waiting it out is how a suite starts flaking. Games
that never offer it are unaffected.

## Selectors

The specs use the app's own class names and its English copy (`src/i18n/en`)
rather than test ids added to the app for their benefit. If a spec breaks after
a UI change, the usual cause is a renamed class or a reworded button — both are
worth knowing about, which is rather the point.

## State of the suite

136 runs — seventeen tests across eight viewport projects — of which 120 execute
and 16 skip themselves, the mobile-only ones on the two projects wide enough for
the desktop layout. About five minutes on a laptop, one worker.

Three things these tests found, all since fixed in the app:

- Draft tiles on a phone overflowed their box and sat on top of Samurai's
  **Confirm hand** button, swallowing the tap.
- Every game's primary buttons were 38px tall on a touch screen rather than the
  44px they were supposed to be; `main.css` now sets that floor for all of them.
- A bottom sheet's own scrim cannot be clicked in the middle, and a sheet takes
  a fifth of a second to slide out of the way of the board underneath it — both
  were bugs in these specs rather than in the app, and both are fixed here.
