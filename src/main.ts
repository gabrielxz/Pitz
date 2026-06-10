import { Game } from "./game/app";
import { loadImages } from "./game/assets";
import { MenuScene } from "./game/scenes/MenuScene";

async function boot(): Promise<void> {
  const mount = document.getElementById("app");
  if (!mount) throw new Error("missing #app mount");

  await loadImages();

  const game = await Game.create(mount);
  game.setScene(new MenuScene(game));
}

void boot();
