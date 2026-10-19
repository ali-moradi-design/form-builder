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

  await page.goto("/forms");
  await expect(page.getByText("1 response")).toBeVisible();
});

test("shows 404 for an unknown form", async ({ page }) => {
  const response = await page.goto("/f/does-not-exist");
  expect(response?.status()).toBe(404);
});
