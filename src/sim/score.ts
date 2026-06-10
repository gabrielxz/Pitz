// Run scoring (Modern). Rewards efficient routes: how close your move count
// is to the shortest possible path across every level, with small nudges for
// time and how many times you peeked at the lights.

import type { PitzGame } from "./engine";
import type { RuleSet } from "./types";

export type Grade = "S" | "A" | "B" | "C" | "D";

export interface Score {
  totalMoves: number;
  minMoves: number;
  efficiency: number; // minMoves / totalMoves, capped at 1
  timeMs: number;
  peeks: number;
  grade: Grade;
  verdict: string;
}

/** Shortest possible move count: Manhattan corner-to-corner per level. */
export function minMovesFor(rule: RuleSet): number {
  return rule.levels.reduce((sum, l) => sum + (l.w - 1) + (l.h - 1), 0);
}

const VERDICTS: Record<Grade, string> = {
  S: "Flawless. You walked it like you could see in the dark.",
  A: "Sharp memory, steady feet.",
  B: "Solid crossing — a few extra steps.",
  C: "You made it. The pits made you work for it.",
  D: "Battered and bruised, but alive at the finish.",
};

export function computeScore(game: PitzGame): Score {
  const minMoves = minMovesFor(game.rule);
  const totalMoves = Math.max(game.totalMoves, 1);
  const efficiency = Math.min(1, minMoves / totalMoves);

  let grade: Grade;
  if (efficiency >= 0.85) grade = "S";
  else if (efficiency >= 0.7) grade = "A";
  else if (efficiency >= 0.55) grade = "B";
  else if (efficiency >= 0.4) grade = "C";
  else grade = "D";

  return {
    totalMoves: game.totalMoves,
    minMoves,
    efficiency,
    timeMs: game.elapsedMs,
    peeks: game.peeks,
    grade,
    verdict: VERDICTS[grade],
  };
}

export function fmtTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
