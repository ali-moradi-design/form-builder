import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(`tpl-${crypto.randomUUID()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/forms$/);
  await page.getByRole("link", { name: "Templates" }).click();
  await page.waitForURL(/\/templates$/);
});

test("filters, previews and creates a form from a template", async ({ page }) => {
  const cards = page.getByRole("heading", { level: 2 });
  await expect(cards).toHaveCount(5);
  await page.getByRole("button", { name: "Hiring" }).click();
  await expect(cards).toHaveText(["Job application"]);
  await page.getByRole("button", { name: /^All/ }).click();
  await page.getByRole("searchbox", { name: "Search templates" }).fill("ticket");
  await expect(cards).toHaveText(["Event registration"]);
  await page.getByRole("searchbox", { name: "Search templates" }).fill("zzz");
  await expect(page.getByText("No template matches your search.")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search templates" }).fill("");

  await page.getByRole("button", { name: "Preview Event registration" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill("Sara Ahmadi");
  await dialog.getByLabel("Email").fill("sara@example.com");
  await dialog.getByRole("radio", { name: /VIP/ }).check();
  await dialog.getByLabel("Number of tickets").fill("2");
  await expect(dialog.getByText("$240")).toBeVisible();
  await dialog.getByRole("button", { name: "فارسی" }).click();
  await expect(dialog.getByLabel("نام و نام خانوادگی")).toBeVisible();
  await dialog.getByRole("button", { name: "English" }).click();

  const results = await new AxeBuilder({ page }).include("[role=dialog]").analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  await dialog.getByRole("button", { name: "Use this template" }).click();
  await page.waitForURL(/\/forms\/[^/]+$/);
  await expect(page.locator('[data-field-key="total"]')).toBeVisible();
});

test("gallery has no accessibility violations", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Templates", level: 1 })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`),
  ).toEqual([]);
});
