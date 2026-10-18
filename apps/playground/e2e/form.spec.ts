import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("fills the classic form and submits clean data", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your name").fill("Sara");
  await page.getByLabel("Team").check();
  await expect(page.getByLabel("How many seats?")).toBeVisible();
  await page.getByLabel("How many seats?").fill("12");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Export").check();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByTestId("submitted")).toContainText('"seats": 12');
  await expect(page.getByTestId("submitted")).toContainText('"features": [\n    "export"\n  ]');
});

test("shows Persian errors right to left in the focus layout", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Focus" }).click();
  await page.getByRole("button", { name: "فارسی" }).click();
  const form = page.locator("form");
  await expect(form).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("پرسش ۱ از ۶")).toBeVisible();
  await page.getByRole("button", { name: "تأیید" }).click();
  await expect(page.getByText("پاسخ به این پرسش لازم است.")).toBeVisible();
});

for (const lang of ["English", "فارسی"]) {
  test(`has no accessibility violations (${lang})`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: lang }).click();
    await page.getByRole("button", { name: /Submit|Next|ارسال|مرحلهٔ بعد/ }).click();
    const results = await new AxeBuilder({ page }).include("form").analyze();
    expect(results.violations).toEqual([]);
  });
}

test("has no accessibility violations in the dark focus layout", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dark" }).click();
  await page.getByRole("button", { name: "Focus" }).click();
  await page.getByRole("button", { name: "OK" }).click();
  const results = await new AxeBuilder({ page }).include("form").analyze();
  expect(results.violations).toEqual([]);
});
