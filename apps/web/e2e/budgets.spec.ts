import { expect, test } from "@playwright/test";

/**
 * Page weight budgets for what visitors load. Sizes are compressed bytes as
 * sent by `next start`. Raise a budget only with a note in docs/decisions.md.
 */
const BUDGET = {
  hostedJs: 240 * 1024,
  hostedCss: 16 * 1024,
  hostedHtml: 16 * 1024,
  embedScript: 2 * 1024,
};

test("the hosted form and the embed script stay within their budgets", async ({
  page,
  browser,
  request,
}) => {
  await page.goto("/sign-in");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(`budget-${crypto.randomUUID()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/forms$/);
  await page.goto("/templates");
  await page.getByRole("button", { name: "Use template: Job application" }).click();
  await page.waitForURL(/\/forms\/[^/]+$/);
  await page.getByRole("button", { name: "Publish" }).click();
  const url = await page.getByRole("dialog").locator("span[dir=ltr]").first().innerText();

  // A fresh context, so nothing comes from the cache.
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(url, { waitUntil: "networkidle" });
  const sizes = await visitor.evaluate(() => {
    const sum = (ext: string) =>
      (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
        .filter((e) => new URL(e.name).pathname.endsWith(ext))
        .reduce((n, e) => n + e.transferSize, 0);
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return { js: sum(".js"), css: sum(".css"), html: nav.transferSize };
  });
  console.log(
    `hosted form: JS ${String(Math.round(sizes.js / 1024))} KB, CSS ${String(Math.round(sizes.css / 1024))} KB, HTML ${String(Math.round(sizes.html / 1024))} KB`,
  );
  expect(sizes.js).toBeGreaterThan(0);
  expect(sizes.js).toBeLessThanOrEqual(BUDGET.hostedJs);
  expect(sizes.css).toBeLessThanOrEqual(BUDGET.hostedCss);
  expect(sizes.html).toBeLessThanOrEqual(BUDGET.hostedHtml);

  const embed = await request.get("/embed.js");
  expect(embed.ok()).toBe(true);
  expect((await embed.body()).byteLength).toBeLessThanOrEqual(BUDGET.embedScript);
});
