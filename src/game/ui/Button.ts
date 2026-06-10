import { Container, Graphics, Text } from "pixi.js";
import { COLORS, styles } from "../theme";
import { audio } from "../audio";

/** A simple drawn button with a text label. */
export class TextButton extends Container {
  private bg: Graphics;
  private labelText: Text;
  private primary: boolean;
  private w: number;
  private h: number;

  constructor(text: string, w: number, h: number, onClick: () => void, primary = false, clickSound = true) {
    super();
    this.primary = primary;
    this.w = w;
    this.h = h;
    this.bg = new Graphics();
    this.addChild(this.bg);
    this.draw(false);

    this.labelText = new Text({ text, style: primary ? styles.heading : styles.button });
    this.labelText.anchor.set(0.5);
    this.labelText.position.set(w / 2, h / 2);
    this.addChild(this.labelText);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = this.bg.getLocalBounds().rectangle;
    this.on("pointerover", () => this.draw(true));
    this.on("pointerout", () => this.draw(false));
    this.on("pointertap", () => {
      if (clickSound) audio.play("click");
      onClick();
    });
  }

  private draw(hover: boolean): void {
    const edge = hover || this.primary ? COLORS.accent : COLORS.panelEdge;
    this.bg
      .clear()
      .roundRect(0, 0, this.w, this.h, 8)
      .fill({ color: hover ? 0x1d2a14 : COLORS.panel, alpha: 0.96 })
      .stroke({ color: edge, width: this.primary ? 2.5 : 2 });
  }

  setLabel(text: string): void {
    this.labelText.text = text;
  }
}
