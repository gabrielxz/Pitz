import { Container, Graphics, Text } from "pixi.js";
import { Scene, type Game } from "../app";
import type { Direction, ModeId } from "../../sim/types";
import { PitzGame } from "../../sim/engine";
import { CLASSIC_RULES } from "../../sim/rules.classic";
import { MODERN_RULES } from "../../sim/rules.modern";
import { randomSeed } from "../../sim/rng";
import { fmtTime } from "../../sim/score";
import { COLORS, STAGE_H, STAGE_W, styles, vary } from "../theme";
import { audio } from "../audio";
import { BoardView } from "../ui/BoardView";
import { TextButton } from "../ui/Button";
import { EndScene } from "./EndScene";
import { MenuScene } from "./MenuScene";

const MOVE_COOLDOWN = 90; // ms between steps, so the dark stays deliberate

export class GameScene extends Scene {
  private mode: ModeId;
  private g: PitzGame;
  private view: BoardView;

  // HUD text nodes
  private levelText!: Text;
  private movesText!: Text;
  private timeText!: Text;
  private lightsText!: Text;
  private batteryBar!: Graphics;
  private batteryWrap!: Container;

  private interstitial: Container | null = null;
  private moveTimer = 0;
  private keyHandler?: (e: KeyboardEvent) => void;

  constructor(game: Game, mode: ModeId) {
    super(game);
    this.mode = mode;
    this.g = new PitzGame(mode === "classic" ? CLASSIC_RULES : MODERN_RULES, randomSeed());

    this.view = new BoardView(this.g.board);
    this.addChild(this.view);

    this.buildHud();
    this.bindKeys();
    this.refreshHud();
  }

  // --- HUD ------------------------------------------------------------------

  private buildHud(): void {
    const px = 1014;
    const pw = 250;
    const panel = new Graphics()
      .roundRect(px, 20, pw, STAGE_H - 40, 14)
      .fill({ color: 0x080c06, alpha: 0.72 })
      .stroke({ color: COLORS.panelEdge, width: 1.5, alpha: 0.8 });
    this.addChild(panel);

    const ix = px + 22;
    const title = new Text({ text: "PITZ!", style: vary(styles.heading, { fontSize: 34, fill: COLORS.accent }) });
    title.position.set(ix, 40);
    this.addChild(title);

    const mode = new Text({ text: this.mode === "classic" ? "Classic" : "Modern", style: styles.hudDim });
    mode.position.set(ix, 82);
    this.addChild(mode);

    this.levelText = new Text({ text: "", style: vary(styles.hud, { fontSize: 20 }) });
    this.levelText.position.set(ix, 128);
    this.addChild(this.levelText);

    this.movesText = new Text({ text: "", style: vary(styles.hud, { fontSize: 20 }) });
    this.movesText.position.set(ix, 162);
    this.addChild(this.movesText);

    this.timeText = new Text({ text: "", style: vary(styles.hud, { fontSize: 20 }) });
    this.timeText.position.set(ix, 196);
    this.addChild(this.timeText);

    // Battery (Modern only)
    this.batteryWrap = new Container();
    this.batteryWrap.position.set(ix, 250);
    const batLabel = new Text({ text: "Light", style: styles.hudDim });
    this.batteryWrap.addChild(batLabel);
    const batFrame = new Graphics().roundRect(0, 26, 206, 20, 5).stroke({ color: COLORS.panelEdge, width: 2 });
    this.batteryWrap.addChild(batFrame);
    this.batteryBar = new Graphics();
    this.batteryWrap.addChild(this.batteryBar);
    this.addChild(this.batteryWrap);
    this.batteryWrap.visible = this.g.isBattery;

    this.lightsText = new Text({ text: "", style: vary(styles.hud, { fontSize: 20 }) });
    this.lightsText.position.set(ix, this.g.isBattery ? 312 : 250);
    this.addChild(this.lightsText);

    // Buttons
    const lightsBtn = new TextButton("Lights (L)", 206, 46, () => this.toggleLights(), true);
    lightsBtn.position.set(ix, 372);
    this.addChild(lightsBtn);

    const menuBtn = new TextButton("Menu", 206, 40, () => this.game.setScene(new MenuScene(this.game)));
    menuBtn.position.set(ix, 430);
    this.addChild(menuBtn);

    // Controls hint
    const hint = new Text({
      text: "Arrow keys / WASD — move\nL or Space — lights\n\nYou can only move with\nthe lights OFF. Light it up,\nmemorize the pits, then\ncross in the dark.",
      style: vary(styles.hudDim, { fontSize: 14, lineHeight: 20 }),
    });
    hint.position.set(ix, 504);
    this.addChild(hint);
  }

  private refreshHud(): void {
    this.levelText.text = this.mode === "classic" ? "One board" : `Level ${this.g.levelIndex + 1} / ${this.g.levelCount}`;
    this.movesText.text = `Moves: ${this.g.totalMoves}`;
    this.timeText.visible = this.g.rule.scoring;
    if (this.g.rule.scoring) this.timeText.text = `Time: ${fmtTime(this.g.elapsedMs)}`;

    this.lightsText.text = this.g.lightsOn ? "Lights: ON" : "Lights: off";
    this.lightsText.style.fill = this.g.lightsOn ? COLORS.battery : COLORS.textDim;

    if (this.g.isBattery) {
      const pct = this.g.batteryPct;
      this.batteryBar.clear();
      const col = pct < 0.25 ? COLORS.batteryLow : COLORS.battery;
      this.batteryBar.roundRect(0, 26, Math.max(0, 206 * pct), 20, 5).fill({ color: col });
    }
  }

  // --- Input ----------------------------------------------------------------

  private bindKeys(): void {
    this.keyHandler = (e: KeyboardEvent) => {
      if (this.interstitial) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          this.advance();
        }
        return;
      }
      switch (e.key) {
        case "ArrowUp": case "w": case "W": this.tryMove("north"); break;
        case "ArrowDown": case "s": case "S": this.tryMove("south"); break;
        case "ArrowLeft": case "a": case "A": this.tryMove("west"); break;
        case "ArrowRight": case "d": case "D": this.tryMove("east"); break;
        case "l": case "L": case " ": e.preventDefault(); this.toggleLights(); break;
        default: return;
      }
    };
    window.addEventListener("keydown", this.keyHandler);
  }

  private tryMove(dir: Direction): void {
    if (this.moveTimer > 0) return;
    if (this.g.lightsOn) {
      audio.play("blocked");
      return;
    }
    const before = this.g.status;
    const moved = this.g.move(dir);
    if (moved) {
      this.moveTimer = MOVE_COOLDOWN;
      this.view.setPlayer(this.g.playerRow, this.g.playerCol);
      if (this.g.status === "dead") audio.play("death");
      else if (this.g.status === "won" || this.g.status === "complete") audio.play("win");
      else audio.play("step");
      this.refreshHud();
      if (this.g.status !== before) this.handleStatus();
    }
  }

  private toggleLights(): void {
    const was = this.g.lightsOn;
    this.g.toggleLights();
    if (this.g.lightsOn !== was) {
      audio.play(this.g.lightsOn ? "lightOn" : "lightOff");
      this.view.setLights(this.g.lightsOn);
      this.refreshHud();
    }
  }

  // --- Status flow ----------------------------------------------------------

  private handleStatus(): void {
    if (this.g.status === "dead") {
      this.toEnd();
    } else if (this.g.status === "complete") {
      this.toEnd();
    } else if (this.g.status === "won") {
      this.showInterstitial();
    }
  }

  private toEnd(): void {
    // Brief pause so the death/win sound and final frame register.
    window.setTimeout(() => this.game.setScene(new EndScene(this.game, this.mode, this.g)), 650);
  }

  private showInterstitial(): void {
    const c = new Container();
    c.addChild(new Graphics().rect(0, 0, STAGE_W, STAGE_H).fill({ color: 0x000000, alpha: 0.72 }));
    const t = new Text({ text: `Level ${this.g.levelIndex + 1} cleared!`, style: styles.big });
    t.anchor.set(0.5);
    t.position.set(STAGE_W / 2, STAGE_H / 2 - 60);
    c.addChild(t);
    const sub = new Text({ text: `${this.g.totalMoves} moves so far · ${fmtTime(this.g.elapsedMs)}`, style: styles.hud });
    sub.anchor.set(0.5);
    sub.position.set(STAGE_W / 2, STAGE_H / 2);
    c.addChild(sub);
    const btn = new TextButton("Next level", 220, 54, () => this.advance(), true);
    btn.position.set(STAGE_W / 2 - 110, STAGE_H / 2 + 50);
    c.addChild(btn);
    const hint = new Text({ text: "— or press Space —", style: vary(styles.hudDim, { fontSize: 15 }) });
    hint.anchor.set(0.5);
    hint.position.set(STAGE_W / 2, STAGE_H / 2 + 128);
    c.addChild(hint);
    this.addChild(c);
    this.interstitial = c;
  }

  private advance(): void {
    if (this.interstitial) {
      this.removeChild(this.interstitial);
      this.interstitial.destroy({ children: true });
      this.interstitial = null;
    }
    this.g.nextLevel();
    this.view.setBoard(this.g.board);
    this.refreshHud();
  }

  // --- Loop -----------------------------------------------------------------

  override update(dtMs: number): void {
    if (this.moveTimer > 0) this.moveTimer = Math.max(0, this.moveTimer - dtMs);
    if (!this.interstitial) this.g.tick(dtMs);
    this.view.tick(dtMs);
    // Battery may auto-cut the lights; keep the view + HUD in sync.
    if (!this.g.lightsOn && this.view) this.view.setLights(false);
    if (this.g.rule.scoring || this.g.isBattery) this.refreshHud();
  }

  override dispose(): void {
    if (this.keyHandler) window.removeEventListener("keydown", this.keyHandler);
  }
}
