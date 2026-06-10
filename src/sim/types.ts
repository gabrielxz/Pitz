// Core types for Pitz. The engine is framework-agnostic and fully testable;
// PixiJS only ever reads this state to draw it.
//
// Classic is faithful to the 2007 C original (legacy/c-original/0.4): a grid of
// grass with hidden pits, a guaranteed path, and the lights mechanic — see the
// whole board while lit, but you can only move while it's dark.
//
// Modern reshapes the lights into a one-shot "fade" reveal (the board opens lit
// and collapses to a follow-spotlight; no re-lighting), adds a beacon you must
// reach before the exit, and a longer ramp of bigger boards.

export type ModeId = "classic" | "modern";

/** Grid cell kinds. Grass/Pit/Path/Finish mirror the original `CELL` enum. */
export const enum Cell {
  Grass = 0,
  Pit = 1,
  Path = 2,
  Finish = 3,
  Objective = 4,
}

export type Status = "playing" | "dead" | "won" | "complete";

export type Direction = "north" | "south" | "east" | "west";

export interface LevelConfig {
  w: number;
  h: number;
  pits: number;
}

/**
 * How the lights behave.
 *  - unlimited: manual toggle, full-board reveal (Classic / the 2007 original).
 *  - fade: each board opens fully lit and fades to the follow-spotlight over
 *    `baseMs + cells * perCellMs`; no re-lighting (Modern).
 */
export type LightsRule =
  | { mode: "unlimited" }
  | { mode: "fade"; baseMs: number; perCellMs: number };

export interface RuleSet {
  id: ModeId;
  name: string;
  levels: LevelConfig[];
  lights: LightsRule;
  /** Reach a beacon before the exit counts (Modern). */
  objective: boolean;
  /** Track moves + time and grade the run (Modern). */
  scoring: boolean;
}
