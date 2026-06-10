import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { Cell } from "../../sim/types";
import type { Board } from "../../sim/level";
import { tex } from "../assets";
import { COLORS } from "../theme";

// Renders a Pitz board with the original's tilted-3D feel, faked in 2D:
//  - a trapezoid projection (far rows smaller + narrower) gives the perspective,
//  - the authentic grass/pit textures tile the ground,
//  - a soft radial "spotlight" masks everything outside a pool of light, which
//    both creates the glowing-oval-in-the-void look and drives the lights
//    mechanic (small pool around the player in the dark; whole board when lit).

const AREA = { cx: 588, cy: 392, w: 820, h: 560 };
const BACK_SCALE = 0.6; // far (top) row size multiplier
const FRONT_SCALE = 1.0; // near (bottom) row
const SQUASH = 0.64; // vertical compression = camera tilt

interface Proj {
  x: number;
  y: number;
  scale: number;
}

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
  private player = new Graphics();
  private light = new Sprite(lightTexture());

  private cellBase = 32;
  private boardPixW = 0;
  private boardPixH = 0;

  /** Current (animated) spotlight state. */
  private curDiam = 0;
  private curX = AREA.cx;
  private curY = AREA.cy;
  private litTarget = false;

  constructor(board: Board) {
    super();
    this.board = board;

    this.addChild(this.content);
    this.content.addChild(this.tileLayer);
    this.content.addChild(this.player);

    this.light.anchor.set(0.5);
    this.addChild(this.light);
    this.content.mask = this.light;

    this.layout();
    this.buildTiles();

    const p = this.project(board.start.row, board.start.col);
    this.curX = p.x;
    this.curY = p.y;
    this.curDiam = this.darkDiameter();
  }

  // --- Projection -----------------------------------------------------------

  private rowScale(row: number): number {
    const h = this.board.h;
    return h <= 1 ? FRONT_SCALE : BACK_SCALE + (FRONT_SCALE - BACK_SCALE) * (row / (h - 1));
  }

  private layout(): void {
    const { w, h } = this.board;
    // Unit dimensions at cellBase = 1.
    let unitH = 0;
    for (let r = 0; r < h; r++) unitH += this.rowScale(r) * SQUASH;
    const unitW = FRONT_SCALE * w;
    this.cellBase = Math.min(AREA.w / unitW, AREA.h / unitH) * 0.96;
    this.boardPixW = this.cellBase * unitW;
    this.boardPixH = this.cellBase * unitH;
  }

  /** Center of a tile in stage space, plus its row scale. */
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
    const { w, h } = this.board;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const cell = this.board.cells[r][c];
        const isPit = cell === Cell.Pit;
        const isFinish = cell === Cell.Finish;
        const sp = new Sprite(isPit ? tex("pit") : tex("grass"));
        sp.anchor.set(0.5);
        const p = this.project(r, c);
        const tw = this.cellBase * p.scale * 1.04;
        const th = this.cellBase * p.scale * SQUASH * 1.04;
        sp.width = tw;
        sp.height = th;
        sp.position.set(p.x, p.y);
        if (isFinish) sp.tint = COLORS.finish;
        this.tileLayer.addChild(sp);
      }
    }
    // Player is drawn on top via setPlayer(), called right after construction.
    this.setPlayer(this.board.start.row, this.board.start.col);
  }

  // --- Player ---------------------------------------------------------------

  setPlayer(row: number, col: number): void {
    const p = this.project(row, col);
    const u = this.cellBase * p.scale; // tile unit
    const g = this.player;
    g.clear();

    // White platform under the figure (a flattened tile-shaped disc).
    g.ellipse(p.x, p.y, u * 0.46, u * 0.46 * SQUASH).fill({ color: COLORS.platform, alpha: 0.95 });

    // Stick figure (red), drawn standing on the platform.
    const col0 = COLORS.player;
    const cx = p.x;
    const baseY = p.y + u * 0.05 * SQUASH; // feet near platform center
    const sc = u * 0.5; // figure height unit
    const lw = Math.max(2, u * 0.06);
    const headR = sc * 0.16;
    const headCY = baseY - sc * 0.92;
    const neckY = baseY - sc * 0.74;
    const hipY = baseY - sc * 0.34;
    const shoulderY = baseY - sc * 0.62;

    // Head
    g.circle(cx, headCY, headR).stroke({ color: col0, width: lw }).fill({ color: 0x220000, alpha: 0.001 });
    // Body
    g.moveTo(cx, neckY).lineTo(cx, hipY).stroke({ color: col0, width: lw });
    // Legs
    g.moveTo(cx - sc * 0.22, baseY).lineTo(cx, hipY).lineTo(cx + sc * 0.22, baseY).stroke({ color: col0, width: lw });
    // Arms
    g.moveTo(cx - sc * 0.26, shoulderY + sc * 0.14).lineTo(cx, shoulderY).lineTo(cx + sc * 0.26, shoulderY + sc * 0.14).stroke({ color: col0, width: lw });

    // Keep the lit pool following the player when dark.
    if (!this.litTarget) {
      this.targetX = p.x;
      this.targetY = p.y;
    }
  }

  // --- Spotlight ------------------------------------------------------------

  private targetX = AREA.cx;
  private targetY = AREA.cy;

  private darkDiameter(): number {
    return this.cellBase * 4.6;
  }
  private litDiameter(): number {
    return Math.max(this.boardPixW, this.boardPixH) * 1.55;
  }

  setLights(on: boolean): void {
    this.litTarget = on;
  }

  /** Animate the spotlight toward its target each frame. */
  tick(dtMs: number): void {
    const k = Math.min(1, dtMs / 90); // smoothing
    const targetDiam = this.litTarget ? this.litDiameter() : this.darkDiameter();
    const tx = this.litTarget ? AREA.cx : this.targetX;
    const ty = this.litTarget ? AREA.cy : this.targetY;

    this.curDiam += (targetDiam - this.curDiam) * k;
    this.curX += (tx - this.curX) * k;
    this.curY += (ty - this.curY) * k;

    this.light.width = this.curDiam;
    this.light.height = this.curDiam;
    this.light.position.set(this.curX, this.curY);
  }

  /** Swap in a new board (next level) and reset the spotlight on the player. */
  setBoard(board: Board): void {
    this.board = board;
    this.layout();
    this.buildTiles();
    const p = this.project(board.start.row, board.start.col);
    this.curX = this.targetX = p.x;
    this.curY = this.targetY = p.y;
    this.litTarget = false;
    this.curDiam = this.darkDiameter();
  }
}
