// Board generation.
//
// Classic (15x15) reproduces the original game_init() carve exactly: a fixed
// serpentine of safe corridors, then random pits scattered over the remaining
// grass. Other sizes (Modern levels) use a randomized but always-solvable path
// so every board can be cleared.

import { Cell, type LevelConfig } from "./types";
import type { Rng } from "./rng";

export interface Board {
  w: number;
  h: number;
  cells: Cell[][];
  start: { row: number; col: number };
  finish: { row: number; col: number };
}

function blank(w: number, h: number): Cell[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => Cell.Grass));
}

/**
 * The original 2014-era carve, valid for the classic 15x15 board. Ported
 * line-for-line from legacy/c-original/0.4/game.c game_init().
 */
function carveClassicPath(cells: Cell[][], w: number, h: number): void {
  const horizHalf = Math.floor(w / 2); // 7
  const vertThird = Math.floor(h / 3); // 5

  for (let row = 0; row < vertThird; row++) {
    cells[row][0] = Cell.Path;
    cells[row][horizHalf] = Cell.Path;
    cells[row][w - 2] = Cell.Path;
    cells[h - 1 - row][0] = Cell.Path;
    cells[h - 1 - row][horizHalf] = Cell.Path;
    cells[h - 1 - row][w - 2] = Cell.Path;
  }
  for (let row = vertThird - 1; row < vertThird + vertThird + 1; row++) {
    cells[row][1] = Cell.Path;
    cells[row][horizHalf + 1] = Cell.Path;
    cells[row][w - 1] = Cell.Path;
  }
  for (let col = 0; col < horizHalf; col++) cells[h - 1][col] = Cell.Path;
  for (let col = horizHalf; col < w - 1; col++) cells[0][col] = Cell.Path;
}

/**
 * A randomized guaranteed path from start (0,0) to finish (h-1,w-1) for Modern
 * boards of any size. A drunk-walk biased toward the finish, so the route
 * meanders but always connects.
 */
function carveRandomPath(cells: Cell[][], w: number, h: number, rng: Rng): void {
  let row = 0;
  let col = 0;
  cells[0][0] = Cell.Path;
  let guard = 0;
  const maxSteps = w * h * 4;
  while ((row !== h - 1 || col !== w - 1) && guard++ < maxSteps) {
    // Bias: usually step toward the finish, occasionally wander sideways.
    const needRow = h - 1 - row;
    const needCol = w - 1 - col;
    const roll = rng.next();
    if (roll < 0.42 && needRow > 0) row++;
    else if (roll < 0.84 && needCol > 0) col++;
    else if (roll < 0.92 && row > 0) row--;
    else if (col > 0) col--;
    else if (needRow > 0) row++;
    cells[row][col] = Cell.Path;
  }
  // Guarantee arrival even if the walk stalled.
  while (row < h - 1) cells[++row][col] = Cell.Path;
  while (col < w - 1) cells[row][++col] = Cell.Path;
}

export function generateLevel(cfg: LevelConfig, rng: Rng): Board {
  const { w, h } = cfg;
  const cells = blank(w, h);

  if (w === 15 && h === 15) carveClassicPath(cells, w, h);
  else carveRandomPath(cells, w, h, rng);

  // Finish in the far corner (mirrors gGrid[GRID_H-1][GRID_W-1] = FINISH).
  cells[h - 1][w - 1] = Cell.Finish;

  // Scatter pits over grass only — never on the safe path or the finish.
  let placed = 0;
  let guard = 0;
  const cap = w * h * 8;
  while (placed < cfg.pits && guard++ < cap) {
    const r = rng.int(h * w);
    const row = Math.floor(r / w);
    const col = r % w;
    if (cells[row][col] === Cell.Grass) {
      cells[row][col] = Cell.Pit;
      placed++;
    }
  }

  return {
    w,
    h,
    cells,
    start: { row: 0, col: 0 },
    finish: { row: h - 1, col: w - 1 },
  };
}
