import { Assets, type Texture } from "pixi.js";

const base = import.meta.env.BASE_URL;
export const asset = (file: string) => `${base}${file}`;

const IMAGE_MANIFEST: Record<string, string> = {
  grass: "textures/grass.png",
  pit: "textures/pit.png",
  origScreenshot: "original/screenshot.png",
  origSplash: "original/splash.png",
};

const textures: Partial<Record<string, Texture>> = {};

export async function loadImages(): Promise<void> {
  await Promise.all(
    Object.entries(IMAGE_MANIFEST).map(async ([key, file]) => {
      textures[key] = await Assets.load(asset(file));
    }),
  );
}

export function tex(key: string): Texture {
  const t = textures[key];
  if (!t) throw new Error(`Texture not loaded: ${key}`);
  return t;
}
