import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { Cell } from "../../sim/types";
import type { Board } from "../../sim/level";
import { tex } from "../assets";
import { COLORS } from "../theme";

// Renders a Pitz board with the original's tilted-3D feel, faked in 2D:
//  - a trapezoid projection (far rows smaller + narrower) gives the perspective,
//  - the authentic grass/pit textures tile the ground,
//  - a soft radial "spotlight" masks everything outside a pool of light. Its
//    radius is driven by a 0..1 light level: 1 floods the whole board (the
//    opening reveal / Classic lights-on), 0 collapses to a small follow-pool.

const AREA = { cx: 588, cy: 392, w: 820, h: 560 };
const BACK_SCALE = 0.6;
const FRONT_SCALE = 1.0;
const SQUASH = 0.64;
const BEACON = 0x39e6ff;

interface Proj {
  x: number;
  y: number;
  scale: number;
}

const smoothstep = (t: number): number => t * t * (3 - 2 * t);

let gradientTex: Texture | null = null;
function lightTexture(): Texture {
  if (gradientTex) return gradientTex;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,1)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  gradientTex = Texture.from(c);
  return gradientTex;
}

export class BoardView extends Container {
  private board: Board;
  private content = new Container();
  private tileLayer = new Container();
  private objectiveLayer = new Container();
  private player = new Graphics();
  private light = new Sprite(lightTexture());

  private cellBase = 32;
  private boardPixW = 0;
  private boardPixH = 0;

  // Spotlight state (animated).
  private curDiam = 0;
  private curX = AREA.cx;
  private curY = AREA.cy;
  private curLevel = 0;
  private targetLevel = 0;
  private playerScreenX = AREA.cx;
  private playerScreenY = AREA.cy;

  constructor(board: Board) {
    super();
    this.board = board;

    this.addChild(this.content);
    this.content.addChild(this.tileLayer);
    this.content.addChild(this.objectiveLayer);
    this.content.addChild(this.player);

    this.light.anchor.set(0.5);
    this.addChild(this.light);
    this.content.mask = this.light;

    this.layout();
    this.buildTiles();

    const p = this.project(board.start.row, board.start.col);
    this.curX = this.playerScreenX = p.x;
    this.curY = this.playerScreenY = p.y;
    this.curDiam = this.darkDiameter();
  }

  // --- Projection -----------------------------------------------------------

  private rowScale(row: number): number {
    const h = this.board.h;
    return h <= 1 ? FRONT_SCALE : BACK_SCALE + (FRONT_SCALE - BACK_SCALE) * (row / (h - 1));
  }

  private layout(): void {
    const { w, h } = this.board;
    let unitH = 0;
    for (let r = 0; r < h; r++) unitH += this.rowScale(r) * SQUASH;
    const unitW = FRONT_SCALE * w;
    this.cellBase = Math.min(AREA.w / unitW, AREA.h / unitH) * 0.96;
    this.boardPixW = this.cellBase * unitW;
    this.boardPixH = this.cellBase * unitH;
  }

  private project(row: number, col: number): Proj {
    const { w } = this.board;
    const topY = AREA.cy - this.boardPixH / 2;
    let y = topY;
    for (let r = 0; r < row; r++) y += this.cellBase * this.rowScale(r) * SQUASH;
    const s = this.rowScale(row);
    y += (this.cellBase * s * SQUASH) / 2;
    const x = AREA.cx + (col - (w - 1) / 2) * this.cellBase * s;
    return { x, y, scale: s };
  }

  private buildTiles(): void {
    this.tileLayer.removeChildren();
    this.objectiveLayer.removeChildren();
    const { w, h } = this.board;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const cell = this.board.cells[r][c];
        const isPit = cell === Cell.Pit;
        const sp = new Sprite(isPit ? tex("pit") : tex("grass"));
        sp.anchor.set(0.5);
        const p = this.project(r, c);
        sp.width = this.cellBase * p.scale * 1.04;
        sp.height = this.cellBase * p.scale * SQUASH * 1.04;
        sp.position.set(p.x, p.y);
        if (cell === Cell.Finish) sp.tint = COLORS.finish;
        this.tileLayer.addChild(sp);
      }
    }
    if (this.board.objective) this.drawBeacon();
    this.setPlayer(this.board.start.row, this.board.start.col);
  }

  private drawBeacon(): void {
    const o = this.board.objective!;
    const p = this.project(o.row, o.col);
    const u = this.cellBase * p.scale;
    const g = new Graphics();
    // Glowing diamond pylon.
    g.poly([p.x, p.y - u * 0.6, p.x + u * 0.34, p.y, p.x, p.y + u * 0.34, p.x - u * 0.34, p.y]).fill({ color: BEACON, alpha: 0.28 });
    g.poly([p.x, p.y - u * 0.42, p.x + u * 0.2, p.y, p.x, p.y + u * 0.22, p.x - u * 0.2, p.y]).fill({ color: BEACON, alpha: 0.95 });
    g.circle(p.x, p.y, u * 0.08).fill({ color: 0xffffff });
    this.objectiveLayer.addChild(g);
  }

  /** Hide the beacon once it's been collected. */
  clearObjective(): void {
    this.objectiveLayer.removeChildren();
  }

  // --- Player ---------------------------------------------------------------

  setPlayer(row: number, col: number): void {
    const p = this.project(row, col);
    const u = this.cellBase * p.scale;
    const g = this.player;
    g.clear();

    g.ellipse(p.x, p.y, u * 0.46, u * 0.46 * SQUASH).fill({ color: COLORS.platform, alpha: 0.95 });

    const col0 = COLORS.player;
    const cx = p.x;
    const baseY = p.y + u * 0.05 * SQUASH;
    const sc = u * 0.5;
    const lw = Math.max(2, u * 0.06);
    const headR = sc * 0.16;
    const headCY = baseY - sc * 0.92;
    const neckY = baseY - sc * 0.74;
    const hipY = baseY - sc * 0.34;
    const shoulderY = baseY - sc * 0.62;

    g.circle(cx, headCY, headR).stroke({ color: col0, width: lw }).fill({ color: 0x220000, alpha: 0.001 });
    g.moveTo(cx, neckY).lineTo(cx, hipY).stroke({ color: col0, width: lw });
    g.moveTo(cx - sc * 0.22, baseY).lineTo(cx, hipY).lineTo(cx + sc * 0.22, baseY).stroke({ color: col0, width: lw });
    g.moveTo(cx - sc * 0.26, shoulderY + sc * 0.14).lineTo(cx, shoulderY).lineTo(cx + sc * 0.26, shoulderY + sc * 0.14).stroke({ color: col0, width: lw });

    this.playerScreenX = p.x;
    this.playerScreenY = p.y;
  }

  // --- Spotlight ------------------------------------------------------------

  private darkDiameter(): number {
    return this.cellBase * 4.6;
  }
  private litDiameter(): number {
    return Math.max(this.boardPixW, this.boardPixH) * 1.55;
  }

  /** Set the desired light level: 0 = dark follow-pool, 1 = whole board. */
  setLightLevel(level: number): void {
    this.targetLevel = Math.max(0, Math.min(1, level));
  }

  tick(dtMs: number): void {
    const k = Math.min(1, dtMs / 90);
    this.curLevel += (this.targetLevel - this.curLevel) * k;

    const diam = this.darkDiameter() + (this.litDiameter() - this.darkDiameter()) * this.curLevel;
    // Pool sits on the player when dark, drifts to board center as it floods.
    const blend = smoothstep(this.curLevel);
    const tx = this.playerScreenX + (AREA.cx - this.playerScreenX) * blend;
    const ty = this.playerScreenY + (AREA.cy - this.playerScreenY) * blend;

    this.curDiam += (diam - this.curDiam) * k;
    this.curX += (tx - this.curX) * k;
    this.curY += (ty - this.curY) * k;

    this.light.width = this.curDiam;
    this.light.height = this.curDiam;
    this.light.position.set(this.curX, this.curY);
  }

  setBoard(board: Board): void {
    this.board = board;
    this.layout();
    this.buildTiles();
    const p = this.project(board.start.row, board.start.col);
    this.curX = this.playerScreenX = p.x;
    this.curY = this.playerScreenY = p.y;
    this.curLevel = this.targetLevel = 0;
    this.curDiam = this.darkDiameter();
  }
}
