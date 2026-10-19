// Also checks the stylesheet size budget. Bundles tiny entry files that import one thing each and fails when code for
// other features ends up in the output. Run after `pnpm build`.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const cases = [
  {
    name: "one field type",
    code: 'import { shortText } from "@formweave/engine/fields"; console.log(shortText);',
    mustNotContain: ["checkboxes", "invalidEmail", "tooEarly", "notInteger"],
  },
  {
    name: "schema types only",
    code: 'import { SCHEMA_VERSION } from "@formweave/schema"; console.log(SCHEMA_VERSION);',
    mustNotContain: ["zod", "Duplicate field key"],
  },
  {
    name: "engine core without fields, messages or i18n",
    code: 'import { compile, evaluate } from "@formweave/engine"; console.log(compile, evaluate);',
    mustNotContain: ["invalidEmail", "Intl.NumberFormat", "This field is required."],
  },
  {
    name: "one React renderer",
    code: 'import { shortTextRenderer } from "@formweave/react/fields"; console.log(shortTextRenderer);',
    mustNotContain: ["fw-choices", "fw-switch", "normalizeDigits"],
    resolveDir: "packages/react",
  },
];

let failed = false;
for (const c of cases) {
  const out = await build({
    stdin: { contents: c.code, resolveDir: c.resolveDir ?? "packages/engine", loader: "js" },
    bundle: true,
    write: false,
    format: "esm",
    minify: false,
    external: ["zod", "zod/*", "react", "react/*", "react-dom", "react-hook-form"],
    logLevel: "silent",
  });
  const text = out.outputFiles[0]?.text ?? "";
  const leaks = c.mustNotContain.filter((s) => text.includes(s));
  if (leaks.length) {
    failed = true;
    console.error(`✗ ${c.name}: bundle contains ${leaks.join(", ")}`);
  } else {
    console.log(`✓ ${c.name} (${String(text.length)} bytes unminified)`);
  }
}
// size-limit cannot measure plain CSS, so the stylesheet budget is checked here.
const css = gzipSync(readFileSync("packages/react/styles.css")).length;
if (css > 4096) {
  failed = true;
  console.error(`✗ default stylesheet is ${String(css)} B gzip (budget 4096 B)`);
} else {
  console.log(`✓ default stylesheet ${String(css)} B gzip (budget 4096 B)`);
}

if (failed) process.exit(1);
