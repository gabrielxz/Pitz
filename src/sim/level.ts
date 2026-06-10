// Board generation.
//
// Classic (15x15) reproduces the original game_init() carve exactly: a fixed
// serpentine of safe corridors, then random pits over the remaining grass.
//
// Modern does NOT reserve any safe corridor — pits scatter across the whole
// field, including the obvious route. Solvability is instead guaranteed by
// rolling layouts until the beacon and exit are reachable (BFS), and only as a
// rare fallback digging the minimal tunnel through the pit field. That keeps the
// route genuinely hidden: you have to memorize it, not just walk the edges.

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

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

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

/** Which cells are reachable from `from`, walking over anything that isn't a pit. */
function reachableFrom(cells: Cell[][], w: number, h: number, from: Pt): boolean[][] {
  const seen = Array.from({ length: h }, () => Array.from({ length: w }, () => false));
  const q: Pt[] = [from];
  seen[from.row][from.col] = true;
  for (let i = 0; i < q.length; i++) {
    const { row, col } = q[i];
    for (const [dr, dc] of DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nc < 0 || nr >= h || nc >= w) continue;
      if (seen[nr][nc] || cells[nr][nc] === Cell.Pit) continue;
      seen[nr][nc] = true;
      q.push({ row: nr, col: nc });
    }
  }
  return seen;
}

/**
 * Fallback only: clear the fewest pits needed to connect `from` to `to`
 * (0-1 BFS, entering a pit costs 1). Leaves a minimal, non-obvious tunnel.
 */
function digMinTunnel(cells: Cell[][], w: number, h: number, from: Pt, to: Pt): void {
  const INF = Infinity;
  const cost = Array.from({ length: h }, () => Array.from({ length: w }, () => INF));
  const prev: (Pt | null)[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => null));
  const deque: Pt[] = [from];
  cost[from.row][from.col] = 0;
  while (deque.length) {
    const cur = deque.shift()!;
    const cc = cost[cur.row][cur.col];
    for (const [dr, dc] of DIRS) {
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (nr < 0 || nc < 0 || nr >= h || nc >= w) continue;
      const step = cells[nr][nc] === Cell.Pit ? 1 : 0;
      if (cc + step < cost[nr][nc]) {
        cost[nr][nc] = cc + step;
        prev[nr][nc] = cur;
        if (step === 0) deque.unshift({ row: nr, col: nc });
        else deque.push({ row: nr, col: nc });
      }
    }
  }
  // Walk back, clearing pits along the chosen route.
  let node: Pt | null = to;
  while (node) {
    if (cells[node.row][node.col] === Cell.Pit) cells[node.row][node.col] = Cell.Grass;
    node = prev[node.row][node.col];
  }
}

function placeMarkers(cells: Cell[][], start: Pt, objective: Pt | null, finish: Pt): void {
  cells[start.row][start.col] = Cell.Path; // protected, walkable, invisible
  cells[finish.row][finish.col] = Cell.Finish;
  if (objective) cells[objective.row][objective.col] = Cell.Objective;
}

/** A fully-random, guaranteed-solvable board with no reserved safe corridor. */
function randomSolvable(cfg: LevelConfig, rng: Rng, start: Pt, objective: Pt | null, finish: Pt): Cell[][] {
  const { w, h } = cfg;
  for (let attempt = 0; attempt < 28; attempt++) {
    const cells = blank(w, h);
    placeMarkers(cells, start, objective, finish);
    scatterPits(cells, w, h, cfg.pits, rng);
    const fromStart = reachableFrom(cells, w, h, start);
    const beaconOk = !objective || fromStart[objective.row][objective.col];
    if (beaconOk && fromStart[finish.row][finish.col]) return cells;
  }
  // Pathological density: dig the minimal route(s) instead.
  const cells = blank(w, h);
  placeMarkers(cells, start, objective, finish);
  scatterPits(cells, w, h, cfg.pits, rng);
  if (objective) {
    digMinTunnel(cells, w, h, start, objective);
    digMinTunnel(cells, w, h, objective, finish);
  } else {
    digMinTunnel(cells, w, h, start, finish);
  }
  return cells;
}

export function generateLevel(cfg: LevelConfig, rng: Rng, withObjective: boolean): Board {
  const { w, h } = cfg;
  const start: Pt = { row: 0, col: 0 };
  const finish: Pt = { row: h - 1, col: w - 1 };
  const objective: Pt | null = withObjective
    ? rng.int(2)
      ? { row: 0, col: w - 1 }
      : { row: h - 1, col: 0 }
    : null;

  let cells: Cell[][];
  if (!withObjective && w === 15 && h === 15) {
    // Faithful classic carve: fixed safe serpentine + random pits on the rest.
    cells = blank(w, h);
    carveClassicPath(cells, w, h);
    cells[finish.row][finish.col] = Cell.Finish;
    scatterPits(cells, w, h, cfg.pits, rng);
  } else {
    cells = randomSolvable(cfg, rng, start, objective, finish);
  }

  return { w, h, cells, start, finish, objective };
}
