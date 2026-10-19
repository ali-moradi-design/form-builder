// @ts-check
import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Routes live in app/ (outside src), so Steiger cannot see that widgets and
    // views are used there. Re-enable once the app has grown.
    rules: { "fsd/insignificant-slice": "off" },
  },
]);
