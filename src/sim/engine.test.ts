import { describe, it, expect } from "vitest";
import { Cell } from "./types";
import { generateLevel, type Board, type Pt } from "./level";
import { makeRng } from "./rng";
import { PitzGame } from "./engine";
import { CLASSIC_RULES } from "./rules.classic";
import { MODERN_RULES } from "./rules.modern";

/** BFS over non-pit tiles: which cells are reachable from `from`? */
function reachable(b: Board, from: Pt): boolean[][] {
  const seen = Array.from({ length: b.h }, () => Array.from({ length: b.w }, () => false));
  const q: Pt[] = [from];
  seen[from.row][from.col] = true;
  while (q.length) {
    const { row, col } = q.shift()!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nc < 0 || nr >= b.h || nc >= b.w) continue;
      if (seen[nr][nc] || b.cells[nr][nc] === Cell.Pit) continue;
      seen[nr][nc] = true;
      q.push({ row: nr, col: nc });
    }
  }
  return seen;
}

describe("classic level generation", () => {
  it("is 15x15 with 45 pits and a corner finish", () => {
    const b = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(1), false);
    expect(b.w).toBe(15);
    expect(b.cells[14][14]).toBe(Cell.Finish);
    expect(b.objective).toBeNull();
    let pits = 0;
    for (const row of b.cells) for (const c of row) if (c === Cell.Pit) pits++;
    expect(pits).toBe(45);
  });

  it("reproduces the original game_init() safe corridors", () => {
    const b = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(123), false);
    expect(b.cells[0][0]).toBe(Cell.Path);
    expect(b.cells[0][7]).toBe(Cell.Path);
    expect(b.cells[7][8]).toBe(Cell.Path);
    expect(b.cells[14][0]).toBe(Cell.Path);
  });

  it("never pits the start tile and is always solvable", () => {
    for (let s = 0; s < 100; s++) {
      const b = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(s * 7 + 3), false);
      expect(b.cells[0][0]).not.toBe(Cell.Pit);
      expect(reachable(b, b.start)[b.finish.row][b.finish.col]).toBe(true);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(999), false);
    const b = generateLevel({ w: 15, h: 15, pits: 45 }, makeRng(999), false);
    expect(a.cells).toEqual(b.cells);
  });
});

describe("modern level generation (objective boards)", () => {
  it("places a beacon and keeps both legs solvable, every size", () => {
    for (const lvl of MODERN_RULES.levels) {
      for (let s = 0; s < 30; s++) {
        const b = generateLevel(lvl, makeRng(s * 13 + 5), true);
        expect(b.objective).not.toBeNull();
        const fromStart = reachable(b, b.start);
        expect(fromStart[b.objective!.row][b.objective!.col]).toBe(true); // start -> beacon
        const fromBeacon = reachable(b, b.objective!);
        expect(fromBeacon[b.finish.row][b.finish.col]).toBe(true); // beacon -> exit
      }
    }
  });
});

describe("classic movement and lights", () => {
  it("cannot move while the lights are on", () => {
    const g = new PitzGame(CLASSIC_RULES, 1);
    g.setLights(true);
    expect(g.lightLevel).toBe(1);
    expect(g.canMoveNow).toBe(false);
    expect(g.move("south")).toBe(false);
    g.setLights(false);
    expect(g.canMoveNow).toBe(true);
  });

  it("moves in the dark, dies on a pit, and an edge is a no-op", () => {
    const g = new PitzGame(CLASSIC_RULES, 1);
    expect(g.move("north")).toBe(false); // edge
    expect(g.move("south")).toBe(true); // col 0 corridor
    expect(g.moves).toBe(1);
    g.board.cells[g.playerRow + 1][g.playerCol] = Cell.Pit;
    g.move("south");
    expect(g.status).toBe("dead");
  });

  it("reaching the finish completes the single classic board", () => {
    const g = new PitzGame(CLASSIC_RULES, 1);
    g.playerRow = 14;
    g.playerCol = 13;
    g.board.cells[14][13] = Cell.Path;
    g.move("east");
    expect(g.status).toBe("complete");
  });
});

describe("modern fade reveal", () => {
  it("starts revealing and blocks movement until the reveal ends", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    expect(g.isRevealing).toBe(true);
    expect(g.lightLevel).toBeGreaterThan(0.9);
    expect(g.canMoveNow).toBe(false);
    expect(g.move("south")).toBe(false);
    g.tick(g.revealMs + 10);
    expect(g.isRevealing).toBe(false);
    expect(g.lightLevel).toBe(0);
    expect(g.canMoveNow).toBe(true);
  });

  it("Space-cutting the reveal lets you move immediately", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    g.cutReveal();
    expect(g.isRevealing).toBe(false);
    g.board.cells[0][1] = Cell.Grass;
    expect(g.move("east")).toBe(true);
  });

  it("does not run the clock during the reveal, only after", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    g.tick(500); // still revealing
    expect(g.elapsedMs).toBe(0);
    g.cutReveal();
    g.tick(500);
    expect(g.elapsedMs).toBe(500);
  });
});

describe("modern objective gating", () => {
  it("reaching the exit without the beacon does not win", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    g.cutReveal();
    const { finish } = g.board;
    g.playerRow = finish.row;
    g.playerCol = finish.col - 1;
    g.board.cells[finish.row][finish.col - 1] = Cell.Path;
    g.move("east"); // onto finish, but no beacon yet
    expect(g.objectiveReached).toBe(false);
    expect(g.status).toBe("playing");
  });

  it("stepping on the beacon arms the exit, then the exit clears the level", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    g.cutReveal();
    // Walk onto a beacon placed next to the start.
    g.board.cells[0][1] = Cell.Objective;
    g.move("east");
    expect(g.objectiveReached).toBe(true);
    expect(g.status).toBe("playing");
    // Now the exit wins (level 1 of many -> "won").
    const { finish } = g.board;
    g.playerRow = finish.row;
    g.playerCol = finish.col - 1;
    g.board.cells[finish.row][finish.col - 1] = Cell.Path;
    g.move("east");
    expect(g.status).toBe("won");
  });

  it("clearing a level advances; the last one completes the run", () => {
    const g = new PitzGame(MODERN_RULES, 1);
    expect(g.levelCount).toBe(MODERN_RULES.levels.length);
    g.cutReveal();
    g.objectiveReached = true;
    const { finish } = g.board;
    g.playerRow = finish.row;
    g.playerCol = finish.col - 1;
    g.board.cells[finish.row][finish.col - 1] = Cell.Path;
    g.move("east");
    expect(g.status).toBe("won");
    g.nextLevel();
    expect(g.levelIndex).toBe(1);
    expect(g.status).toBe("playing");
    expect(g.isRevealing).toBe(true); // fresh reveal on the new board
  });
});
