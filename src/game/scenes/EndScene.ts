import { Container, Graphics, Text } from "pixi.js";
import { Scene, type Game } from "../app";
import type { ModeId } from "../../sim/types";
import type { PitzGame } from "../../sim/engine";
import { computeScore, fmtTime } from "../../sim/score";
import { COLORS, STAGE_H, STAGE_W, styles, vary } from "../theme";
import { TextButton } from "../ui/Button";
import { GameScene } from "./GameScene";
import { MenuScene } from "./MenuScene";

export class EndScene extends Scene {
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(game: Game, mode: ModeId, g: PitzGame) {
    super(game);

    this.addChild(new Graphics().rect(0, 0, STAGE_W, STAGE_H).fill({ color: COLORS.bg }));

    const dead = g.status === "dead";
    const panel = new Container();
    panel.position.set(STAGE_W / 2, 150);
    this.addChild(panel);

    const heading = new Text({
      text: dead ? "You fell in a pit." : "You made it across!",
      style: vary(styles.big, { fill: dead ? COLORS.danger : COLORS.accent }),
    });
    heading.anchor.set(0.5, 0);
    panel.addChild(heading);

    const lines: string[] = [];
    if (mode === "modern") {
      lines.push(dead ? `Reached level ${g.levelIndex + 1} of ${g.levelCount}` : `All ${g.levelCount} levels cleared`);
    }
    lines.push(`${g.totalMoves} moves`);
    if (g.rule.scoring) lines.push(`Time ${fmtTime(g.elapsedMs)}`);

    const sub = new Text({ text: lines.join("\n"), style: vary(styles.hud, { align: "center", lineHeight: 28 }) });
    sub.anchor.set(0.5, 0);
    sub.position.set(0, 96);
    panel.addChild(sub);

    // Score grade (Modern, win only).
    let nextY = 200;
    if (mode === "modern" && !dead && g.rule.scoring) {
      const score = computeScore(g);
      const grade = new Text({ text: score.grade, style: vary(styles.big, { fontSize: 96 }) });
      grade.anchor.set(0.5, 0);
      grade.position.set(0, 190);
      panel.addChild(grade);
      const verdict = new Text({ text: score.verdict, style: vary(styles.hudDim, { fontSize: 18 }) });
      verdict.anchor.set(0.5, 0);
      verdict.position.set(0, 312);
      panel.addChild(verdict);
      nextY = 372;
    }

    const playAgain = new TextButton("Play again", 220, 54, () => this.game.setScene(new GameScene(this.game, mode)), true);
    playAgain.position.set(STAGE_W / 2 - 230, 150 + nextY);
    this.addChild(playAgain);

    const menu = new TextButton("Menu", 220, 54, () => this.game.setScene(new MenuScene(this.game)));
    menu.position.set(STAGE_W / 2 + 10, 150 + nextY);
    this.addChild(menu);

    const hint = new Text({ text: "— press Space to play again —", style: vary(styles.hudDim, { fontSize: 15 }) });
    hint.anchor.set(0.5, 0);
    hint.position.set(STAGE_W / 2, 150 + nextY + 76);
    this.addChild(hint);

    // Space / Enter = Play again, so you never have to leave the keyboard.
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this.game.setScene(new GameScene(this.game, mode));
      }
    };
    window.addEventListener("keydown", this.keyHandler);
  }

  override dispose(): void {
    if (this.keyHandler) window.removeEventListener("keydown", this.keyHandler);
  }
}
