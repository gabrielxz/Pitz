import { Container, Graphics, Text } from "pixi.js";
import { COLORS, STAGE_H, STAGE_W, styles, vary, wrapped } from "../theme";
import { TextButton } from "./Button";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "The goal",
    body: "Walk your little stick figure from the near corner to the red FINISH tile in the far corner. The field is dotted with pits — step on one and it's over.",
  },
  {
    title: "The catch — the lights",
    body: "You can only move while the lights are OFF, and in the dark a spotlight only shows the ground right around you. Turn the lights ON to flood the whole board and reveal every pit — but you can't take a single step while they're on.",
  },
  {
    title: "So you...",
    body: "Light it up, memorize the safe route, kill the lights, and cross from memory. Then light it up again to re-check. The grass and the safe path look identical — only the dark pits and the red finish stand out.",
  },
  {
    title: "Controls",
    body: "Arrow keys or WASD to move · L or Space to toggle the lights.",
  },
  {
    title: "Modern mode",
    body: "Six boards that grow larger and pittier. Your lights run on a battery that drains while on and recharges while you move in the dark — so peek wisely. Your moves, time and peeks are graded at the end.",
  },
];

export class HelpOverlay extends Container {
  constructor(onClose: () => void) {
    super();
    this.eventMode = "static";
    // Full-screen backdrop that swallows clicks.
    this.addChild(
      new Graphics().rect(0, 0, STAGE_W, STAGE_H).fill({ color: 0x000000, alpha: 0.78 }),
    );

    const pw = 760;
    const ph = 560;
    const px = (STAGE_W - pw) / 2;
    const py = (STAGE_H - ph) / 2;
    this.addChild(
      new Graphics().roundRect(px, py, pw, ph, 16).fill({ color: COLORS.panel, alpha: 0.98 }).stroke({ color: COLORS.panelEdge, width: 2 }),
    );

    const title = new Text({ text: "How to Play", style: vary(styles.heading, { fontSize: 32, fill: COLORS.accent }) });
    title.position.set(px + 34, py + 26);
    this.addChild(title);

    let y = py + 84;
    for (const s of SECTIONS) {
      const h = new Text({ text: s.title, style: vary(styles.hud, { fontSize: 19, fill: COLORS.accent }) });
      h.position.set(px + 34, y);
      this.addChild(h);
      y += 26;
      const b = new Text({ text: s.body, style: wrapped(styles.hudDim, pw - 68, 15) });
      b.position.set(px + 34, y);
      this.addChild(b);
      y += b.height + 16;
    }

    const close = new TextButton("Got it", 160, 46, onClose, true);
    close.position.set(STAGE_W / 2 - 80, py + ph - 64);
    this.addChild(close);
  }
}
