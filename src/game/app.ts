import { Application, Container } from "pixi.js";
import { STAGE_H, STAGE_W, COLORS } from "./theme";

/** A scene is a container with optional per-frame update + teardown hooks. */
export abstract class Scene extends Container {
  constructor(protected game: Game) {
    super();
  }
  update(_dtMs: number): void {}
  dispose(): void {}
}

export class Game {
  app: Application;
  private current: Scene | null = null;

  private constructor(app: Application) {
    this.app = app;
  }

  static async create(mount: HTMLElement): Promise<Game> {
    const app = new Application();
    await app.init({
      width: STAGE_W,
      height: STAGE_H,
      background: COLORS.bg,
      antialias: true,
      autoDensity: false,
    });
    mount.appendChild(app.canvas);

    const game = new Game(app);
    app.ticker.add((ticker) => game.current?.update(ticker.deltaMS));
    return game;
  }

  setScene(scene: Scene): void {
    if (this.current) {
      this.app.stage.removeChild(this.current);
      this.current.dispose();
      this.current.destroy({ children: true });
    }
    this.current = scene;
    this.app.stage.addChild(scene);
  }
}
