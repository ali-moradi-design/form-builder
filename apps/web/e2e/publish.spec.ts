import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("publishes a form and collects a response on the hosted page", async ({ page, browser }) => {
  await page.goto("/sign-in");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(`pub-${crypto.randomUUID()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/forms$/);
  await page.getByRole("button", { name: /Blank form/ }).click();
  await page.waitForURL(/\/forms\/[^/]+$/);
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add Short text" }).click();
  await page.getByLabel("Label · English").fill("Your city");
  await page.getByRole("switch", { name: "Required" }).click();

  await page.getByRole("button", { name: "Publish" }).click();
  const dialog = page.getByRole("dialog", { name: "Version 1 is live" });
  await expect(dialog).toBeVisible();
  const url = await dialog.locator("span[dir=ltr]").innerText();
  expect(url).toMatch(/\/f\/blank-form(-[0-9a-f]{6})?$/);
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Live, v1")).toBeVisible();

  // Edits after publishing don't change the live version.
  await page.getByLabel("Label · English").fill("Your town");
  await expect(page.getByRole("status").first()).toHaveText("Saved");

  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(url);
  await expect(visitor.getByLabel("Your city")).toBeVisible();
  const results = await new AxeBuilder({ page: visitor }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await visitor.getByRole("button", { name: "Submit" }).click();
  await expect(visitor.getByText("This field is required.")).toBeVisible();
  await visitor.getByLabel("Your city").fill("Shiraz");
  await visitor.getByRole("button", { name: "Submit" }).click();
  await expect(visitor.getByRole("heading", { name: "Thank you!" })).toBeVisible();

  // Public API: same validation, honeypot, error codes.
  const slug = new URL(url).pathname.split("/").pop() ?? "";
  const api = page.request;
  const live = await api.get(`/api/forms/${slug}`);
  expect(live.status()).toBe(200);
  expect(await live.json()).toMatchObject({ version: 1, document: { title: "Blank form" } });
  const post = (data: unknown) => api.post(`/api/forms/${slug}/responses`, { data });
  const invalid = await post({ values: {} });
  expect(invalid.status()).toBe(422);
  const body = (await invalid.json()) as { issues: unknown[] };
  expect(body.issues[0]).toMatchObject({ key: "text", code: "required" });
  const created = await post({ values: { text: "Tabriz" }, locale: "en" });
  expect(created.status()).toBe(201);
  expect(await created.json()).toMatchObject({ version: 1 });
  const bot = await post({ values: { text: "spam" }, _hp: "https://spam.example" });
  expect(bot.status()).toBe(201);
  expect(await bot.json()).toEqual({ id: null, version: null });
  const text = await api.post(`/api/forms/${slug}/responses`, {
    data: "x",
    headers: { "content-type": "text/plain" },
  });
  expect(text.status()).toBe(415);
  expect((await api.get("/api/forms/nope")).status()).toBe(404);

  await page.goto("/forms");
  await page.getByRole("link", { name: "2 responses" }).click();
  await expect(page.getByRole("heading", { name: "Responses" })).toBeVisible();
  const table = page.getByRole("table");
  await expect(table.getByRole("columnheader", { name: "Your city" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Tabriz" })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Shiraz" })).toBeVisible();
  // Detail view: every answer of one response.
  await table
    .getByRole("row", { name: /Shiraz/ })
    .getByRole("button")
    .click();
  const detail = page.getByRole("dialog", { name: "Response" });
  await expect(detail.getByText("Your city")).toBeVisible();
  await expect(detail.getByText("Shiraz")).toBeVisible();
  await detail.getByRole("button", { name: "Close" }).click();
  const a11y = await new AxeBuilder({ page }).analyze();
  expect(a11y.violations.map((v) => v.id)).toEqual([]);

  // Delete the API response.
  await table
    .getByRole("row", { name: /Tabriz/ })
    .getByRole("checkbox")
    .check();
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(table.getByRole("cell", { name: "Tabriz" })).toBeHidden();
  await expect(table.getByRole("cell", { name: "Shiraz" })).toBeVisible();

  // Filters live in the URL.
  await page.getByLabel("Date range").selectOption("7");
  await expect(page).toHaveURL(/days=7/);
  await expect(table.getByRole("cell", { name: "Shiraz" })).toBeVisible();

  // Exports: the menu builds the link; the files hold the answers.
  await page.getByRole("button", { name: "Export" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download CSV" }).click();
  expect((await download).suggestedFilename()).toBe("blank-form-responses.csv");
  const base = new URL(page.url());
  const exportUrl = (format: string) => `${base.pathname}/export?format=${format}`;
  const csv = await page.request.get(exportUrl("csv"));
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const csvText = await csv.text();
  expect(csvText).toContain("Your city");
  expect(csvText).toContain("Shiraz");
  const json = (await (await page.request.get(exportUrl("json"))).json()) as { data: unknown }[];
  expect(json.map((r) => r.data)).toEqual([{ text: "Shiraz" }]);
  const xlsx = await page.request.get(exportUrl("xlsx"));
  expect(xlsx.status()).toBe(200);
  expect((await xlsx.body()).subarray(0, 2).toString()).toBe("PK");

  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(page.getByRole("heading", { name: "Responses per day" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your city" })).toContainText("Shiraz");
  const charts = await new AxeBuilder({ page }).analyze();
  expect(charts.violations.map((v) => v.id)).toEqual([]);
});

test("shows 404 for an unknown form", async ({ page }) => {
  const response = await page.goto("/f/does-not-exist");
  expect(response?.status()).toBe(404);
});
