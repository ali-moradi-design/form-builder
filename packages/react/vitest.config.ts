import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    // Own cache folder: packages run their tests in parallel.
    fsModuleCachePath: fileURLToPath(new URL("node_modules/.vitest-cache", import.meta.url)),
  },
});
