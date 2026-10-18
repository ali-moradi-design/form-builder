// Bundles tiny entry files that import one thing each and fails when code for
// other features ends up in the output. Run after `pnpm build`.
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
];

let failed = false;
for (const c of cases) {
  const out = await build({
    stdin: { contents: c.code, resolveDir: "packages/engine", loader: "js" },
    bundle: true,
    write: false,
    format: "esm",
    minify: false,
    external: ["zod", "zod/*"],
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
if (failed) process.exit(1);
