import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/meta.ts"],
  format: "esm",
  platform: "neutral",
  dts: true,
  sourcemap: true,
  unbundle: true,
});
