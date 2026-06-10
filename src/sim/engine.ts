// The Pitz run: a player crossing one or more boards of hidden pits.
//
// Faithful core (from legacy/c-original/0.4/game.c): you move one tile at a
// time with the arrow keys, but ONLY while the lights are off; stepping on a
// pit kills you, reaching the finish wins. Modern adds a draining light battery,
// a sequence of levels, and move/time scoring — all gated by the RuleSet.

import { Cell, type Direction, type RuleSet, type Status } from "./types";
import { generateLevel, type Board } from "./level";
import { makeRng, type Rng } from "./rng";

export class PitzGame {
  readonly rule: RuleSet;
  board!: Board;
  levelIndex = 0;
  status: Status = "playing";

  playerRow = 0;
  playerCol = 0;
  lightsOn = false;

  /** Moves on the current level, and across the whole run. */
  moves = 0;
  totalMoves = 0;
  /** Number of times the lights were switched on (a "peek"). */
  peeks = 0;
  /** Run time in ms, accumulated only while actively playing. */
  elapsedMs = 0;

  /** Light battery (Modern). 0..max. Always full for unlimited lights. */
  battery = 1;

  private seed: number;
  private rng: Rng;

  constructor(rule: RuleSet, seed: number) {
    this.rule = rule;
    this.seed = seed >>> 0;
    this.rng = makeRng(this.seed);
    this.loadLevel(0);
  }

  // --- Lights ---------------------------------------------------------------

  get isBattery(): boolean {
    return this.rule.lights.mode === "battery";
  }

  /** Battery as 0..1 (always 1 when lights are unlimited). */
  get batteryPct(): number {
    if (this.rule.lights.mode !== "battery") return 1;
    return this.battery / this.rule.lights.max;
  }

  setLights(on: boolean): void {
    if (this.status !== "playing") return;
    if (on === this.lightsOn) return;
    // Can't switch the lights on with a dead battery.
    if (on && this.rule.lights.mode === "battery" && this.battery <= 0) return;
    if (on) this.peeks++;
    this.lightsOn = on;
  }

  toggleLights(): void {
    this.setLights(!this.lightsOn);
  }

  // --- Movement -------------------------------------------------------------

  /** Attempt a move. Returns true if the player actually changed tiles. */
  move(dir: Direction): boolean {
    if (this.status !== "playing") return false;
    // Faithful rule: you cannot move while the lights are on.
    if (this.lightsOn) return false;

    let { playerRow: row, playerCol: col } = this;
    switch (dir) {
      case "north": if (row > 0) row--; break;
      case "south": if (row < this.board.h - 1) row++; break;
      case "east": if (col < this.board.w - 1) col++; break;
      case "west": if (col > 0) col--; break;
    }
    if (row === this.playerRow && col === this.playerCol) return false; // edge: no-op

    this.playerRow = row;
    this.playerCol = col;
    this.moves++;
    this.totalMoves++;

    const cell = this.board.cells[row][col];
    if (cell === Cell.Pit) {
      this.status = "dead";
    } else if (cell === Cell.Finish) {
      this.status = this.levelIndex >= this.rule.levels.length - 1 ? "complete" : "won";
    }
    return true;
  }

  // --- Time / battery upkeep ------------------------------------------------

  /** Advance real-time systems (run timer + light battery). dt in ms. */
  tick(dtMs: number): void {
    if (this.status !== "playing") return;
    this.elapsedMs += dtMs;

    if (this.rule.lights.mode === "battery") {
      const L = this.rule.lights;
      const dt = dtMs / 1000;
      if (this.lightsOn) {
        this.battery -= L.drainPerSec * dt;
        if (this.battery <= 0) {
          this.battery = 0;
          this.lightsOn = false; // forced blackout
        }
      } else if (this.battery < L.max) {
        this.battery = Math.min(L.max, this.battery + L.rechargePerSec * dt);
      }
    }
  }

  // --- Level / run flow -----------------------------------------------------

  private loadLevel(index: number): void {
    this.levelIndex = index;
    this.board = generateLevel(this.rule.levels[index], this.rng);
    this.playerRow = this.board.start.row;
    this.playerCol = this.board.start.col;
    this.lightsOn = false;
    this.moves = 0;
    if (this.rule.lights.mode === "battery") this.battery = this.rule.lights.max;
    this.status = "playing";
  }

  /** Advance to the next level after a cleared one (Modern). */
  nextLevel(): void {
    if (this.levelIndex < this.rule.levels.length - 1) this.loadLevel(this.levelIndex + 1);
  }

  /** Restart the whole run with a fresh board layout. */
  restart(): void {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    this.rng = makeRng(this.seed);
    this.totalMoves = 0;
    this.peeks = 0;
    this.elapsedMs = 0;
    this.loadLevel(0);
  }

  /** Convenience: total levels in this run. */
  get levelCount(): number {
    return this.rule.levels.length;
  }
}
