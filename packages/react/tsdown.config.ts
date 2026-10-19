import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/fields/index.ts", "src/remote.tsx"],
  format: "esm",
  platform: "neutral",
  dts: true,
  sourcemap: true,
  unbundle: true,
});
