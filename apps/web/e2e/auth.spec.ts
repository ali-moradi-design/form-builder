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

test("the nightly reset needs its token and restores the demo forms", async ({ page, request }) => {
  expect((await request.post("/api/demo/reset")).status()).toBe(401);
  expect(
    (
      await request.post("/api/demo/reset", { headers: { Authorization: "Bearer wrong" } })
    ).status(),
  ).toBe(401);

  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Try the demo account" }).click();
  await page.waitForURL(/\/forms$/);
  await page.getByRole("button", { name: /Blank form/ }).click();
  await page.waitForURL(/\/forms\/[^/]+$/);

  const reset = await request.post("/api/demo/reset", {
    headers: { Authorization: "Bearer e2e-demo-reset" },
  });
  expect(await reset.json()).toEqual({ reset: true });

  // The reset signs the demo out; signing in again shows only the sample forms.
  await page.goto("/forms");
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByRole("button", { name: "Try the demo account" }).click();
  await page.waitForURL(/\/forms$/);
  await expect(page.getByRole("link", { name: /Blank form/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Job application/ })).toBeVisible();
  await expect(page.getByText("24 responses")).toBeVisible();
});
