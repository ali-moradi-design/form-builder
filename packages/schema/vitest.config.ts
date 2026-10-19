import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Own cache folder: packages run their tests in parallel.
  test: {
    fsModuleCachePath: fileURLToPath(new URL("node_modules/.vitest-cache", import.meta.url)),
  },
});
