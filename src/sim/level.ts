// Board generation.
//
// Classic (15x15) reproduces the original game_init() carve exactly: a fixed
// serpentine of safe corridors, then random pits over the remaining grass.
// Modern boards carve a randomized but always-solvable route — and, when an
// objective is requested, the route runs start -> beacon -> exit so both legs
// are guaranteed crossable.

import { Cell, type LevelConfig } from "./types";
import type { Rng } from "./rng";

export interface Pt {
  row: number;
  col: number;
}

export interface Board {
  w: number;
  h: number;
  cells: Cell[][];
  start: Pt;
  finish: Pt;
  objective: Pt | null;
}

function blank(w: number, h: number): Cell[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => Cell.Grass));
}

/** The original 2007 carve, valid for the classic 15x15 board (game_init()). */
function carveClassicPath(cells: Cell[][], w: number, h: number): void {
  const horizHalf = Math.floor(w / 2);
  const vertThird = Math.floor(h / 3);
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

/** A target-biased drunk walk from `from` to `to`, marking PATH. Always arrives. */
function carveWalk(cells: Cell[][], from: Pt, to: Pt, rng: Rng, w: number, h: number): void {
  let r = from.row;
  let c = from.col;
  cells[r][c] = Cell.Path;
  let guard = 0;
  const cap = w * h * 4;
  while ((r !== to.row || c !== to.col) && guard++ < cap) {
    const dr = to.row - r;
    const dc = to.col - c;
    const roll = rng.next();
    if (roll < 0.3 && dc !== 0) c += Math.sign(dc);
    else if (roll < 0.6 && dr !== 0) r += Math.sign(dr);
    else if (roll < 0.74 && c > 0 && c < w - 1) c += rng.int(2) ? 1 : -1;
    else if (roll < 0.84 && r > 0 && r < h - 1) r += rng.int(2) ? 1 : -1;
    else if (dr !== 0) r += Math.sign(dr);
    else if (dc !== 0) c += Math.sign(dc);
    cells[r][c] = Cell.Path;
  }
  while (r !== to.row) { r += Math.sign(to.row - r); cells[r][c] = Cell.Path; }
  while (c !== to.col) { c += Math.sign(to.col - c); cells[r][c] = Cell.Path; }
}

function scatterPits(cells: Cell[][], w: number, h: number, pits: number, rng: Rng): void {
  let placed = 0;
  let guard = 0;
  const cap = w * h * 8;
  while (placed < pits && guard++ < cap) {
    const r = rng.int(h * w);
    const row = Math.floor(r / w);
    const col = r % w;
    if (cells[row][col] === Cell.Grass) {
      cells[row][col] = Cell.Pit;
      placed++;
    }
  }
}

export function generateLevel(cfg: LevelConfig, rng: Rng, withObjective: boolean): Board {
  const { w, h } = cfg;
  const cells = blank(w, h);
  const start: Pt = { row: 0, col: 0 };
  const finish: Pt = { row: h - 1, col: w - 1 };
  let objective: Pt | null = null;

  if (withObjective) {
    // Beacon in one of the two "off" corners, forcing an L-shaped detour.
    objective = rng.int(2) ? { row: 0, col: w - 1 } : { row: h - 1, col: 0 };
    carveWalk(cells, start, objective, rng, w, h);
    carveWalk(cells, objective, finish, rng, w, h);
  } else if (w === 15 && h === 15) {
    carveClassicPath(cells, w, h);
  } else {
    carveWalk(cells, start, finish, rng, w, h);
  }

  cells[finish.row][finish.col] = Cell.Finish;
  if (objective) cells[objective.row][objective.col] = Cell.Objective;

  scatterPits(cells, w, h, cfg.pits, rng);

  return { w, h, cells, start, finish, objective };
}
