/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  // itch.io serves the game from a subdirectory, so use relative asset paths.
  base: "./",
  build: {
    target: "es2022",
    outDir: "dist",
    assetsInlineLimit: 0,
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
