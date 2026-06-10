import { Graphics, Sprite, Text } from "pixi.js";
import { Scene, type Game } from "../app";
import { tex } from "../assets";
import { COLORS, STAGE_H, STAGE_W, styles, vary, wrapped } from "../theme";
import { TextButton } from "../ui/Button";
import { MenuScene } from "./MenuScene";

const PARAGRAPHS = [
  "Pitz was my very first game — written in C in 2006–2007, using SDL and OpenGL. You crossed a field of hidden pits, and the whole game turned on one idea: you could light up the board to see the danger, but you could only move once the lights were off.",
  "It grew over four versions (0.1 through 0.4): first the grid and movement, then textures for the grass and pits, a follow-spotlight in the dark, a splash screen, and a stick-figure hero the notes affectionately called \"Mr SquareHead.\"",
  "This is that game, faithfully rebuilt in TypeScript and PixiJS so it can run in a browser. Classic mode keeps the original's single 15×15 board and unlimited lights; Modern adds a campaign of bigger boards, a light battery, and scoring. The grass and pit textures here are the very same ones from 2007.",
];

export class AboutScene extends Scene {
  constructor(game: Game) {
    super(game);

    this.addChild(new Graphics().rect(0, 0, STAGE_W, STAGE_H).fill({ color: COLORS.bg }));

    const title = new Text({ text: "About Pitz", style: vary(styles.big, { fontSize: 48 }) });
    title.anchor.set(0.5, 0);
    title.position.set(STAGE_W / 2, 56);
    this.addChild(title);

    const sub = new Text({ text: "a hidden-pit maze · 2006–2007 · remade " + new Date().getFullYear(), style: vary(styles.hudDim, {}) });
    sub.anchor.set(0.5, 0);
    sub.position.set(STAGE_W / 2, 122);
    this.addChild(sub);

    // Original screenshot on the right.
    const shot = new Sprite(tex("origScreenshot"));
    const sw = 300;
    shot.width = sw;
    shot.height = sw * (shot.texture.height / shot.texture.width);
    shot.position.set(STAGE_W - sw - 110, 184);
    shot.eventMode = "none";
    this.addChild(shot);
    const cap = new Text({ text: "Pitz 0.4, April 2007", style: vary(styles.hudDim, { fontSize: 13 }) });
    cap.anchor.set(0.5, 0);
    cap.position.set(STAGE_W - sw / 2 - 110, 184 + shot.height + 8);
    this.addChild(cap);

    let y = 188;
    for (const p of PARAGRAPHS) {
      const t = new Text({ text: p, style: wrapped(styles.body, 640, 17) });
      t.position.set(110, y);
      this.addChild(t);
      y += t.height + 18;
    }

    const back = new TextButton("Back", 180, 50, () => this.game.setScene(new MenuScene(this.game)), true);
    back.position.set(110, STAGE_H - 86);
    this.addChild(back);
  }
}
