import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/expr.ts"],
  format: "esm",
  platform: "neutral",
  dts: true,
  sourcemap: true,
});
