import { Graphics, Sprite, Text } from "pixi.js";
import { Scene, type Game } from "../app";
import type { ModeId } from "../../sim/types";
import { tex } from "../assets";
import { COLORS, STAGE_H, STAGE_W, styles, vary, wrapped } from "../theme";
import { TextButton } from "../ui/Button";
import { HelpOverlay } from "../ui/HelpOverlay";
import { GameScene } from "./GameScene";
import { AboutScene } from "./AboutScene";

export class MenuScene extends Scene {
  private help: HelpOverlay | null = null;

  constructor(game: Game) {
    super(game);

    // Backdrop: a dark void with the grass texture faintly tiled at the bottom,
    // echoing the in-game ground.
    this.addChild(new Graphics().rect(0, 0, STAGE_W, STAGE_H).fill({ color: COLORS.bg }));
    const ground = new Sprite(tex("grass"));
    ground.width = STAGE_W;
    ground.height = 260;
    ground.position.set(0, STAGE_H - 200);
    ground.alpha = 0.16;
    this.addChild(ground);

    const title = new Text({ text: "PITZ!", style: styles.title });
    title.anchor.set(0.5, 0);
    title.position.set(STAGE_W / 2, 96);
    this.addChild(title);

    const tag = new Text({
      text: "Cross the field without falling in a pit — but you can only move in the dark.",
      style: vary(styles.hud, { fill: COLORS.textDim }),
    });
    tag.anchor.set(0.5, 0);
    tag.position.set(STAGE_W / 2, 206);
    this.addChild(tag);

    // Nostalgia chip: the original 2007 screenshot.
    const shot = new Sprite(tex("origScreenshot"));
    const sw = 168;
    shot.width = sw;
    shot.height = sw * (shot.texture.height / shot.texture.width);
    shot.position.set(STAGE_W - sw - 40, STAGE_H - shot.height - 40);
    this.addChild(shot);
    const shotCap = new Text({ text: "the 2007 original", style: vary(styles.hudDim, { fontSize: 13 }) });
    shotCap.anchor.set(0.5, 0);
    shotCap.position.set(STAGE_W - sw / 2 - 40, STAGE_H - 36);
    this.addChild(shotCap);

    // Play buttons, centered.
    const bw = 320;
    const bx = STAGE_W / 2 - bw / 2;
    this.playButton("Play Classic", "One 15×15 board, 45 hidden pits, unlimited lights — the faithful 2007 game.", bx, 286, bw, "classic");
    this.playButton("Play Modern", "Six escalating boards, a draining light battery, and a graded run.", bx, 392, bw, "modern");

    // Secondary row.
    const sy = 500;
    const helpBtn = new TextButton("How to Play", 154, 46, () => this.openHelp());
    helpBtn.position.set(STAGE_W / 2 - 160, sy);
    this.addChild(helpBtn);
    const aboutBtn = new TextButton("About", 154, 46, () => this.game.setScene(new AboutScene(this.game)));
    aboutBtn.position.set(STAGE_W / 2 + 6, sy);
    this.addChild(aboutBtn);
  }

  private playButton(label: string, desc: string, x: number, y: number, w: number, mode: ModeId): void {
    const btn = new TextButton(label, w, 56, () => this.game.setScene(new GameScene(this.game, mode)), true);
    btn.position.set(x, y);
    this.addChild(btn);
    const sub = new Text({ text: desc, style: wrapped(styles.hudDim, w, 14) });
    sub.position.set(x + 2, y + 60);
    this.addChild(sub);
  }

  private openHelp(): void {
    if (this.help) return;
    this.help = new HelpOverlay(() => {
      if (this.help) {
        this.removeChild(this.help);
        this.help.destroy({ children: true });
        this.help = null;
      }
    });
    this.addChild(this.help);
  }
}
