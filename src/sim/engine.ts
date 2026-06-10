// The Pitz run: a player crossing one or more boards of hidden pits.
//
// Faithful core (legacy/c-original/0.4/game.c): you move one tile at a time
// with the arrow keys, but only while the lights are off; stepping on a pit
// kills you, reaching the finish wins.
//
// Classic keeps the original's manual, unlimited lights. Modern swaps them for
// a one-shot "fade": every board opens fully lit and collapses to a small
// follow-spotlight — memorize the route while it fades, then cross with no way
// to re-light. Modern boards also require reaching a beacon before the exit.

import { Cell, type Direction, type RuleSet, type Status } from "./types";
import { generateLevel, type Board, type Pt } from "./level";
import { makeRng, type Rng } from "./rng";

const manhattan = (a: Pt, b: Pt): number => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

export class PitzGame {
  readonly rule: RuleSet;
  board!: Board;
  levelIndex = 0;
  status: Status = "playing";

  playerRow = 0;
  playerCol = 0;

  /** Manual lights (Classic). */
  lightsOn = false;
  /** Fade reveal countdown in ms (Modern); 0 when the board has gone dark. */
  revealLeft = 0;
  revealMs = 0;

  /** Has the player reached this board's beacon yet? */
  objectiveReached = false;

  moves = 0;
  totalMoves = 0;
  elapsedMs = 0;
  /** Shortest possible move count across loaded levels (for scoring). */
  minMovesTotal = 0;

  private seed: number;
  private rng: Rng;

  constructor(rule: RuleSet, seed: number) {
    this.rule = rule;
    this.seed = seed >>> 0;
    this.rng = makeRng(this.seed);
    this.loadLevel(0);
  }

  // --- Lights ---------------------------------------------------------------

  get isFade(): boolean {
    return this.rule.lights.mode === "fade";
  }
  get isRevealing(): boolean {
    return this.isFade && this.revealLeft > 0;
  }

  /** 0 = dark (follow-spotlight), 1 = whole board lit. Drives the view. */
  get lightLevel(): number {
    if (this.rule.lights.mode === "unlimited") return this.lightsOn ? 1 : 0;
    if (this.revealMs <= 0 || this.revealLeft <= 0) return 0;
    // Hold full for the first third, then fade to dark.
    const frac = this.revealLeft / this.revealMs;
    return Math.min(1, frac / 0.66);
  }

  get canMoveNow(): boolean {
    return this.status === "playing" && !this.lightsOn && !this.isRevealing;
  }

  /** Classic manual toggle (no-op in fade mode). */
  setLights(on: boolean): void {
    if (this.rule.lights.mode !== "unlimited") return;
    if (this.status !== "playing") return;
    this.lightsOn = on;
  }
  toggleLights(): void {
    this.setLights(!this.lightsOn);
  }

  /** Modern: end the opening reveal early and start moving. */
  cutReveal(): void {
    if (this.isRevealing) this.revealLeft = 0;
  }

  // --- Movement -------------------------------------------------------------

  move(dir: Direction): boolean {
    if (!this.canMoveNow) return false;

    let { playerRow: row, playerCol: col } = this;
    switch (dir) {
      case "north": if (row > 0) row--; break;
      case "south": if (row < this.board.h - 1) row++; break;
      case "east": if (col < this.board.w - 1) col++; break;
      case "west": if (col > 0) col--; break;
    }
    if (row === this.playerRow && col === this.playerCol) return false;

    this.playerRow = row;
    this.playerCol = col;
    this.moves++;
    this.totalMoves++;

    const cell = this.board.cells[row][col];
    if (cell === Cell.Pit) {
      this.status = "dead";
    } else if (cell === Cell.Objective) {
      this.objectiveReached = true;
    } else if (cell === Cell.Finish) {
      // Must grab the beacon first when the board has one.
      if (!this.rule.objective || this.objectiveReached) {
        this.status = this.levelIndex >= this.rule.levels.length - 1 ? "complete" : "won";
      }
    }
    return true;
  }

  // --- Time / reveal upkeep -------------------------------------------------

  tick(dtMs: number): void {
    if (this.status !== "playing") return;
    if (this.isRevealing) {
      this.revealLeft = Math.max(0, this.revealLeft - dtMs);
    } else {
      // The clock runs once the board is dark and you're actually crossing.
      this.elapsedMs += dtMs;
    }
  }

  // --- Level / run flow -----------------------------------------------------

  private loadLevel(index: number): void {
    this.levelIndex = index;
    const cfg = this.rule.levels[index];
    this.board = generateLevel(cfg, this.rng, this.rule.objective);
    this.playerRow = this.board.start.row;
    this.playerCol = this.board.start.col;
    this.lightsOn = false;
    this.objectiveReached = false;
    this.moves = 0;

    if (this.rule.lights.mode === "fade") {
      this.revealMs = this.rule.lights.baseMs + cfg.w * cfg.h * this.rule.lights.perCellMs;
      this.revealLeft = this.revealMs;
    } else {
      this.revealMs = 0;
      this.revealLeft = 0;
    }

    // Accumulate the shortest legal route for scoring.
    if (this.board.objective) {
      this.minMovesTotal += manhattan(this.board.start, this.board.objective) + manhattan(this.board.objective, this.board.finish);
    } else {
      this.minMovesTotal += manhattan(this.board.start, this.board.finish);
    }

    this.status = "playing";
  }

  nextLevel(): void {
    if (this.levelIndex < this.rule.levels.length - 1) this.loadLevel(this.levelIndex + 1);
  }

  restart(): void {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    this.rng = makeRng(this.seed);
    this.totalMoves = 0;
    this.elapsedMs = 0;
    this.minMovesTotal = 0;
    this.loadLevel(0);
  }

  get levelCount(): number {
    return this.rule.levels.length;
  }
}
