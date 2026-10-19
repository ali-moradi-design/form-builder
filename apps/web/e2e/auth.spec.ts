import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("sends signed-out visitors to sign in", async ({ page }) => {
  await page.goto("/forms");
  await expect(page).toHaveURL(/\/sign-in$/);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test("rejects a wrong password", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrong password");
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("opens the demo account with a sample form, and signs out", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Try the demo account" }).click();
  await page.waitForURL(/\/forms$/);
  await expect(page.getByText("demo@formweave.dev")).toBeVisible();
  await expect(page.getByRole("link", { name: /Product feedback/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/sign-in$/);
  await page.goto("/forms");
  await expect(page).toHaveURL(/\/sign-in$/);
});
