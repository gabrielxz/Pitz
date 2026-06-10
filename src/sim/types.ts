// Core types for Pitz. The engine is framework-agnostic and fully testable;
// PixiJS only ever reads this state to draw it.
//
// Faithful to the 2007 C original (see legacy/c-original/0.4): a grid of grass
// with hidden pits, a guaranteed solvable path, and the signature "lights"
// mechanic — you can see the whole board while the lights are on, but you can
// only move while they are off.

export type ModeId = "classic" | "modern";

/** Grid cell kinds — mirrors the original `CELL` enum. */
export const enum Cell {
  Grass = 0,
  Pit = 1,
  Path = 2,
  Finish = 3,
}

export type Status = "playing" | "dead" | "won" | "complete";

export type Direction = "north" | "south" | "east" | "west";

/** One board. Classic is a single level; Modern is a sequence of these. */
export interface LevelConfig {
  w: number;
  h: number;
  pits: number;
}

/** How the lights behave. Classic = unlimited; Modern = a draining battery. */
export type LightsRule =
  | { mode: "unlimited" }
  | { mode: "battery"; max: number; drainPerSec: number; rechargePerSec: number };

export interface RuleSet {
  id: ModeId;
  name: string;
  levels: LevelConfig[];
  lights: LightsRule;
  /** Track moves + time and grade the run (Modern). */
  scoring: boolean;
}
