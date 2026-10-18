// Renders every mockup page to html/<name>.html and png/<name>.png.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { pages } from "./pages.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
await mkdir(`${root}html`, { recursive: true });
await mkdir(`${root}png`, { recursive: true });

const only = process.argv.slice(2);
const browser = await chromium.launch();
for (const p of pages) {
  if (only.length && !only.includes(p.name)) continue;
  const html = `<!doctype html>
<html lang="${p.lang ?? "en"}" dir="${p.lang === "fa" ? "rtl" : "ltr"}" data-theme="${p.theme ?? "light"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.title}</title><link rel="stylesheet" href="../styles.css"></head>
<body class="${p.bodyClass ?? ""}">${p.body}</body></html>`;
  const file = `${root}html/${p.name}.html`;
  await writeFile(file, html);
  const page = await browser.newPage({
    viewport: { width: p.width ?? 1440, height: p.height ?? 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(`file://${file}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${root}png/${p.name}.png` });
  await page.close();
  console.log("rendered", p.name);
}
await browser.close();

