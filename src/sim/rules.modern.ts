import type { RuleSet } from "./types";

// Modern: a campaign of progressively larger, denser boards, a light battery
// that forces you to ration your peeks, and move/time scoring at the end.
export const MODERN_RULES: RuleSet = {
  id: "modern",
  name: "Modern",
  levels: [
    { w: 9, h: 9, pits: 16 },
    { w: 11, h: 11, pits: 24 },
    { w: 13, h: 13, pits: 34 },
    { w: 15, h: 15, pits: 48 },
    { w: 17, h: 17, pits: 64 },
    { w: 19, h: 19, pits: 80 },
  ],
  // Battery: ~6s of continuous light on a full charge; recharges slowly while
  // you move in the dark, so peeking is a resource you have to spend wisely.
  lights: { mode: "battery", max: 100, drainPerSec: 16, rechargePerSec: 6 },
  scoring: true,
};
