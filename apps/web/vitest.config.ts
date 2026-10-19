import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@/": fileURLToPath(new URL("./src/", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts"],
    // Own cache folder: packages run their tests in parallel.
    fsModuleCachePath: fileURLToPath(new URL("node_modules/.vitest-cache", import.meta.url)),
  },
});
