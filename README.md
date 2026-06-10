# Pitz!

A hidden-pit maze game. Cross the field from corner to corner without falling
into a pit — but you can only move while the lights are **off**. Switch the
lights **on** to reveal every pit, memorize the safe route, then cross in the
dark from memory.

Originally written in C with SDL + OpenGL in 2006–2007 (it was my first game).
This is a faithful remake in **TypeScript + PixiJS** that runs in the browser.

## Modes

- **Classic** — one 15×15 board, 45 hidden pits, unlimited lights. The exact
  scope of the 2007 original (`legacy/c-original/0.4`), with its real grass and
  pit textures.
- **Modern** — a campaign of six progressively larger, denser boards; a light
  **battery** that drains while lit and recharges while you move in the dark, so
  peeking is a resource; and a graded run (moves, time, peeks).

## Controls

- **Arrow keys / WASD** — move (only with the lights off)
- **L / Space** — toggle the lights

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # sim unit tests (Vitest)
npm run build      # type-check + production build to dist/
npm run pack       # build, then zip dist/ -> pitz-itch.zip for itch.io
```

## Layout

- `src/sim/` — framework-agnostic, fully tested game logic (board generation,
  movement, lights/battery, scoring).
- `src/game/` — PixiJS rendering: the tilted-3D board with a follow-spotlight,
  scenes, and HUD.
- `legacy/c-original/` — the original 2006–2007 C source (versions 0.1–0.4),
  preserved for posterity.
- `legacy/unity-stub/` — an abandoned 2018 Unity restart that never got past a
  Hello-World scene.
