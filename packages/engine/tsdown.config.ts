import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/expr.ts",
    "src/fields/index.ts",
    "src/fields/all.ts",
    "src/i18n.ts",
    "src/messages.ts",
  ],
  format: "esm",
  platform: "neutral",
  dts: true,
  sourcemap: true,
});
