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

  // HUD
  private levelText!: Text;
  private movesText!: Text;
  private timeText!: Text;
  private statusText!: Text;
  private objectiveText!: Text;
  private revealWrap!: Container;
  private revealBar!: Graphics;
  private actionBtn!: TextButton;

  private interstitial: Container | null = null;
  private moveTimer = 0;
  private beaconCleared = false;
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
    this.addChild(
      new Graphics()
        .roundRect(px, 20, pw, STAGE_H - 40, 14)
        .fill({ color: 0x080c06, alpha: 0.72 })
        .stroke({ color: COLORS.panelEdge, width: 1.5, alpha: 0.8 }),
    );

    const ix = px + 22;
    const title = new Text({ text: "PITZ!", style: vary(styles.heading, { fontSize: 34, fill: COLORS.accent }) });
    title.position.set(ix, 38);
    this.addChild(title);
    const modeLabel = new Text({ text: this.mode === "classic" ? "Classic" : "Modern", style: styles.hudDim });
    modeLabel.position.set(ix, 80);
    this.addChild(modeLabel);

    this.levelText = new Text({ text: "", style: vary(styles.hud, { fontSize: 20 }) });
    this.levelText.position.set(ix, 122);
    this.addChild(this.levelText);
    this.movesText = new Text({ text: "", style: vary(styles.hud, { fontSize: 20 }) });
    this.movesText.position.set(ix, 154);
    this.addChild(this.movesText);
    this.timeText = new Text({ text: "", style: vary(styles.hud, { fontSize: 20 }) });
    this.timeText.position.set(ix, 186);
    this.addChild(this.timeText);

    this.objectiveText = new Text({ text: "", style: vary(styles.hud, { fontSize: 18 }) });
    this.objectiveText.position.set(ix, 226);
    this.objectiveText.visible = this.g.rule.objective;
    this.addChild(this.objectiveText);

    // Reveal countdown bar (Modern fade).
    this.revealWrap = new Container();
    this.revealWrap.position.set(ix, 270);
    const label = new Text({ text: "Memorize the route!", style: vary(styles.hudDim, { fontSize: 14, fill: COLORS.battery }) });
    this.revealWrap.addChild(label);
    this.revealWrap.addChild(new Graphics().roundRect(0, 24, 206, 16, 4).stroke({ color: COLORS.panelEdge, width: 2 }));
    this.revealBar = new Graphics();
    this.revealWrap.addChild(this.revealBar);
    this.addChild(this.revealWrap);
    this.revealWrap.visible = false;

    this.statusText = new Text({ text: "", style: vary(styles.hud, { fontSize: 18 }) });
    this.statusText.position.set(ix, 320);
    this.addChild(this.statusText);

    // Action button: Classic toggles lights; Modern ends the reveal early.
    this.actionBtn = new TextButton(this.mode === "classic" ? "Lights (L)" : "I'm ready  ▸", 206, 46, () => this.action(), true);
    this.actionBtn.position.set(ix, 372);
    this.addChild(this.actionBtn);

    const menuBtn = new TextButton("Menu", 206, 40, () => this.game.setScene(new MenuScene(this.game)));
    menuBtn.position.set(ix, 430);
    this.addChild(menuBtn);

    const hint =
      this.mode === "classic"
        ? "Arrow keys / WASD — move\nL or Space — lights\n\nYou can only move with the\nlights OFF. Light it up,\nmemorize the pits, then\ncross in the dark."
        : "Arrow keys / WASD — move\nSpace — start early\n\nThe board lights up, then\nfades. Memorize the route —\nthere's no second look.\nReach the beacon, then exit.";
    const hintText = new Text({ text: hint, style: vary(styles.hudDim, { fontSize: 14, lineHeight: 20 }) });
    hintText.position.set(ix, 500);
    this.addChild(hintText);
  }

  private refreshHud(): void {
    this.levelText.text = this.mode === "classic" ? "One board" : `Level ${this.g.levelIndex + 1} / ${this.g.levelCount}`;
    this.movesText.text = `Moves: ${this.g.totalMoves}`;
    this.timeText.visible = this.g.rule.scoring;
    if (this.g.rule.scoring) this.timeText.text = `Time: ${fmtTime(this.g.elapsedMs)}`;

    if (this.g.rule.objective) {
      const got = this.g.objectiveReached;
      this.objectiveText.text = got ? "Beacon ✓ — reach the exit" : "Find the beacon";
      this.objectiveText.style.fill = got ? COLORS.accent : 0x39e6ff;
    }

    // Reveal bar + status line.
    if (this.g.isRevealing) {
      this.revealWrap.visible = true;
      const frac = this.revealMs > 0 ? this.g.revealLeft / this.revealMs : 0;
      this.revealBar.clear().roundRect(0, 24, Math.max(0, 206 * frac), 16, 4).fill({ color: COLORS.battery });
      this.statusText.text = "";
    } else {
      this.revealWrap.visible = false;
      if (this.mode === "classic") {
        this.statusText.text = this.g.lightsOn ? "Lights: ON" : "Lights: off";
        this.statusText.style.fill = this.g.lightsOn ? COLORS.battery : COLORS.textDim;
      } else {
        this.statusText.text = "Dark — go!";
        this.statusText.style.fill = COLORS.textDim;
      }
    }

    // Action button visibility: Modern only shows it during the reveal.
    this.actionBtn.visible = this.mode === "classic" || this.g.isRevealing;
  }

  private get revealMs(): number {
    return this.g.revealMs;
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
        case "l": case "L": case " ": e.preventDefault(); this.action(); break;
        default: return;
      }
    };
    window.addEventListener("keydown", this.keyHandler);
  }

  /** Action button / Space / L: toggle lights (Classic) or end the reveal (Modern). */
  private action(): void {
    if (this.mode === "classic") {
      const was = this.g.lightsOn;
      this.g.toggleLights();
      if (this.g.lightsOn !== was) {
        audio.play(this.g.lightsOn ? "lightOn" : "lightOff");
        this.refreshHud();
      }
    } else if (this.g.isRevealing) {
      this.g.cutReveal();
      audio.play("lightOff");
      this.refreshHud();
    }
  }

  private tryMove(dir: Direction): void {
    if (this.moveTimer > 0) return;
    if (!this.g.canMoveNow) {
      if (this.g.lightsOn) audio.play("blocked"); // classic: lights are on
      return;
    }
    const before = this.g.status;
    const moved = this.g.move(dir);
    if (moved) {
      this.moveTimer = MOVE_COOLDOWN;
      this.view.setPlayer(this.g.playerRow, this.g.playerCol);
      if (this.g.status === "dead") audio.play("death");
      else if (this.g.status === "won" || this.g.status === "complete") audio.play("win");
      else if (this.g.objectiveReached && !this.beaconCleared) audio.play("lightOn");
      else audio.play("step");
      this.refreshHud();
      if (this.g.status !== before) this.handleStatus();
    }
  }

  // --- Status flow ----------------------------------------------------------

  private handleStatus(): void {
    if (this.g.status === "dead" || this.g.status === "complete") this.toEnd();
    else if (this.g.status === "won") this.showInterstitial();
  }

  private toEnd(): void {
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
    this.beaconCleared = false;
    this.refreshHud();
  }

  // --- Loop -----------------------------------------------------------------

  override update(dtMs: number): void {
    if (this.moveTimer > 0) this.moveTimer = Math.max(0, this.moveTimer - dtMs);
    if (!this.interstitial) this.g.tick(dtMs);

    this.view.setLightLevel(this.g.lightLevel);
    this.view.tick(dtMs);

    // Collect the beacon visually the moment it's reached.
    if (this.g.objectiveReached && !this.beaconCleared) {
      this.view.clearObjective();
      this.beaconCleared = true;
    }

    this.refreshHud();
  }

  override dispose(): void {
    if (this.keyHandler) window.removeEventListener("keydown", this.keyHandler);
  }
}
