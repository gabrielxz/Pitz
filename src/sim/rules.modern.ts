import type { RuleSet } from "./types";

// Modern: a longer campaign of progressively larger, denser boards. Each one
// opens fully lit and fades to a small follow-spotlight over a few seconds —
// memorize it while you can, because there's no re-lighting. You must reach the
// beacon before the exit, and your moves + time are graded at the end.
export const MODERN_RULES: RuleSet = {
  id: "modern",
  name: "Modern",
  levels: [
    { w: 11, h: 11, pits: 22 },
    { w: 13, h: 13, pits: 34 },
    { w: 15, h: 15, pits: 50 },
    { w: 17, h: 17, pits: 68 },
    { w: 19, h: 19, pits: 90 },
    { w: 21, h: 21, pits: 116 },
    { w: 23, h: 23, pits: 144 },
  ],
  // Reveal time scales with board area: ~2.6s on the first board, ~5.2s on the
  // last. Generous enough to study, short enough to pressure — and you can end
  // it early when you're ready.
  lights: { mode: "fade", baseMs: 2000, perCellMs: 6 },
  objective: true,
  scoring: true,
};
