import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: false,
  clean: true,
  bundle: true,
  minify: true,
  outDir: "dist",
  format: "esm",
  target: "esnext",
  keepNames: true,
  external: ["bun"],
});
