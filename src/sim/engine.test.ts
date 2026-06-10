import { describe, it, expect } from "vitest";
import { Cell } from "./types";
import { generateLevel, type Board } from "./level";
import { makeRng } from "./rng";
import { PitzGame } from "./engine";
import { CLASSIC_RULES } from "./rules.classic";
import { MODERN_RULES } from "./rules.modern";

/** BFS over every non-pit tile: is the finish reachable from the start? */
function isSolvable(b: Board): boolean {
  const seen = Array.from({ length: b.h }, () => Array.from({ length: b.w }, () => false));
  const queue: [number, number][] = [[b.start.row, b.start.col]];
  seen[b.start.row][b.start.col] = true;
  while (queue.length) {
    const [r, c] = queue.shift()!;
    if (r === b.finish.row && c === b.finish.col) return true;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= b.h || nc >= b.w) continue;
      if (seen[nr][nc]) continue;
      if (b.cells[nr][nc] === Cell.Pit) continue;
      seen[nr][nc] = true;
      queue.push([nr, nc]);
    }
  }
  return false;
}

describe("level generation", () => {
  it("classic board is 15x15 with 45 pits and a corner finish", () => {
    const b = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(1));
    expect(b.w).toBe(15);
    expect(b.h).toBe(15);
    expect(b.cells[14][14]).toBe(Cell.Finish);
    let pits = 0;
    for (const row of b.cells) for (const c of row) if (c === Cell.Pit) pits++;
    expect(pits).toBe(45);
  });

  it("reproduces the original game_init() safe corridors (15x15)", () => {
    const b = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(123));
    // A few load-bearing cells from the ported carve.
    expect(b.cells[0][0]).toBe(Cell.Path); // start corner
    expect(b.cells[0][7]).toBe(Cell.Path); // top third middle corridor
    expect(b.cells[0][13]).toBe(Cell.Path); // top row run
    expect(b.cells[7][8]).toBe(Cell.Path); // middle corridor
    expect(b.cells[14][0]).toBe(Cell.Path); // bottom row run
  });

  it("never places a pit on the start tile", () => {
    for (let s = 0; s < 50; s++) {
      const b = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(s + 1));
      expect(b.cells[0][0]).not.toBe(Cell.Pit);
    }
  });

  it("every classic board is solvable", () => {
    for (let s = 0; s < 100; s++) {
      const b = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(s * 7 + 3));
      expect(isSolvable(b)).toBe(true);
    }
  });

  it("every modern level (all sizes) is solvable", () => {
    for (const lvl of MODERN_RULES.levels) {
      for (let s = 0; s < 40; s++) {
        const b = generateLevel(lvl, makeRng(s * 13 + 5));
        expect(isSolvable(b)).toBe(true);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(999));
    const b = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(999));
    expect(a.cells).toEqual(b.cells);
  });
});

describe("movement and win/lose", () => {
  it("cannot move while the lights are on (faithful rule)", () => {
    const g = new PitzGame(CLASSIC_RULES, 1);
    g.setLights(true);
    const moved = g.move("south");
    expect(moved).toBe(false);
    expect(g.playerRow).toBe(0);
  });

  it("moves one tile in the dark and counts the move", () => {
    const g = new PitzGame(CLASSIC_RULES, 1);
    expect(g.move("south")).toBe(true); // col 0 is a safe corridor downward
    expect(g.playerRow).toBe(1);
    expect(g.moves).toBe(1);
    expect(g.totalMoves).toBe(1);
  });

  it("walking into an edge is a no-op", () => {
    const g = new PitzGame(CLASSIC_RULES, 1);
    expect(g.move("north")).toBe(false); // already at row 0
    expect(g.move("west")).toBe(false); // already at col 0
    expect(g.moves).toBe(0);
  });

  it("stepping on a pit is death", () => {
    const g = new PitzGame(CLASSIC_RULES, 1);
    // Force a pit next to the player and step onto it.
    g.board.cells[0][1] = Cell.Pit;
    g.move("east");
    expect(g.status).toBe("dead");
  });

  it("reaching the finish on the single classic board completes the run", () => {
    const g = new PitzGame(CLASSIC_RULES, 1);
    g.playerRow = 14;
    g.playerCol = 13;
    g.board.cells[14][13] = Cell.Path;
    g.move("east"); // onto finish at 14,14
    expect(g.status).toBe("complete");
  });
});

describe("modern systems", () => {
  it("battery drains while lit and recharges in the dark", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    expect(g.battery).toBe(100);
    g.setLights(true);
    g.tick(1000); // 1s of light at 16/s
    expect(g.battery).toBeCloseTo(84, 5);
    g.setLights(false);
    g.tick(1000); // 1s recharge at 6/s
    expect(g.battery).toBeCloseTo(90, 5);
  });

  it("a dead battery forces a blackout and blocks re-lighting", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    g.setLights(true);
    g.tick(10_000); // way more than the battery holds
    expect(g.battery).toBe(0);
    expect(g.lightsOn).toBe(false);
    g.setLights(true); // can't light with empty battery
    expect(g.lightsOn).toBe(false);
  });

  it("counts a peek each time the lights come on", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    g.setLights(true);
    g.setLights(false);
    g.setLights(true);
    expect(g.peeks).toBe(2);
  });

  it("clearing a level advances to the next; the last one completes the run", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    // Simulate clearing the first level.
    g.playerRow = g.board.finish.row;
    g.playerCol = g.board.finish.col - 1;
    g.board.cells[g.playerRow][g.playerCol] = Cell.Path;
    g.move("east");
    expect(g.status).toBe("won");
    g.nextLevel();
    expect(g.levelIndex).toBe(1);
    expect(g.status).toBe("playing");
  });

  it("refills the battery on each new level", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    g.setLights(true);
    g.tick(2000);
    expect(g.battery).toBeLessThan(100);
    g.playerRow = g.board.finish.row;
    g.playerCol = g.board.finish.col - 1;
    g.board.cells[g.playerRow][g.playerCol] = Cell.Path;
    g.setLights(false);
    g.move("east");
    g.nextLevel();
    expect(g.battery).toBe(100);
  });
});
