import type { RuleSet } from "./types";

// Classic: one 15x15 board with 45 pits and unlimited lights — exactly the
// scope of the 2007 original (legacy/c-original/0.4). Light it up as long as
// you like to memorize the route; you just can't move until it's dark again.
export const CLASSIC_RULES: RuleSet = {
  id: "classic",
  name: "Classic",
  levels: [{ w: 15, h: 15, pits: 45 }],
  lights: { mode: "unlimited" },
  scoring: false,
};
