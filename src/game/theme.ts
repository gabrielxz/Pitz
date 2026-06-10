import { TextStyle } from "pixi.js";
import type { TextStyleOptions } from "pixi.js";

export const STAGE_W = 1280;
export const STAGE_H = 720;

export const COLORS = {
  bg: 0x050507,
  text: 0xe8f0d8,
  textDim: 0x9fb08a,
  grass: 0x66bb44,
  finish: 0xff3b30,
  player: 0xff2a2a,
  platform: 0xe8e6dc,
  accent: 0x8bd450,
  panel: 0x0e140c,
  panelEdge: 0x39562a,
  battery: 0xffd54f,
  batteryLow: 0xff5252,
  danger: 0xff5252,
};

const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

export const styles = {
  title: new TextStyle({ fontFamily: FONT, fontSize: 88, fontWeight: "bold", fill: COLORS.accent, stroke: { color: 0x102008, width: 6 }, letterSpacing: 2 }),
  heading: new TextStyle({ fontFamily: FONT, fontSize: 26, fontWeight: "bold", fill: COLORS.text }),
  hud: new TextStyle({ fontFamily: FONT, fontSize: 18, fill: COLORS.text }),
  hudDim: new TextStyle({ fontFamily: FONT, fontSize: 15, fill: COLORS.textDim }),
  button: new TextStyle({ fontFamily: FONT, fontSize: 18, fontWeight: "bold", fill: COLORS.text }),
  big: new TextStyle({ fontFamily: FONT, fontSize: 56, fontWeight: "bold", fill: COLORS.accent, stroke: { color: 0x102008, width: 5 } }),
  body: new TextStyle({ fontFamily: FONT, fontSize: 17, fill: COLORS.text, wordWrap: true, wordWrapWidth: 640, lineHeight: 24 }),
};

/** A copy of a base style with overrides applied. Cloning (not spreading a
 *  TextStyle instance) is the reliable way to derive styles in Pixi v8. */
export function vary(base: TextStyle, overrides: Partial<TextStyleOptions>): TextStyle {
  const s = base.clone();
  Object.assign(s, overrides);
  return s;
}

/** Word-wrapping copy of a base style (clone carries wordWrap reliably in Pixi v8). */
export function wrapped(base: TextStyle, width: number, fontSize?: number, align?: "left" | "center" | "right"): TextStyle {
  const s = base.clone();
  s.wordWrap = true;
  s.wordWrapWidth = width;
  if (fontSize != null) s.fontSize = fontSize;
  if (align != null) s.align = align;
  return s;
}
