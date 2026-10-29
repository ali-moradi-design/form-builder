import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility audit: every app page, in English and Persian, light and dark,
 * scanned with axe for WCAG 2.1 A and AA rules.
 */
const scan = async (page: Page, name: string) => {
  await page.waitForLoadState("networkidle");
  // After a client-side navigation (router.push) the URL changes before the
  // new page's <title> is in place. Wait for it; a page that never gets a
  // title is still reported by axe below.
  await page
    .waitForFunction(() => document.title.trim() !== "", undefined, { timeout: 5_000 })
    .catch(() => undefined);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  return results.violations.map(
    (v) => `${name} · ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
};

for (const locale of ["en", "fa"] as const) {
  for (const scheme of ["light", "dark"] as const) {
    test(`every page passes axe (${locale}, ${scheme})`, async ({ page, browser, context }) => {
      test.setTimeout(90_000);
      await context.addCookies([{ name: "locale", value: locale, url: "http://localhost:3200" }]);
      await page.emulateMedia({ colorScheme: scheme });
      const found: string[] = [];

      await page.goto("/sign-in");
      found.push(...(await scan(page, "sign-in")));
      await page.getByRole("tab", { name: /Create account|ساخت حساب/ }).click();
      await page.getByLabel(/^(Email|ایمیل)$/).fill(`a11y-${crypto.randomUUID()}@example.com`);
      await page.getByLabel(/^(Password|گذرواژه)$/).fill("correct horse battery");
      await page
        .locator("form")
        .getByRole("button", { name: /Create account|ساخت حساب/ })
        .click();
      await page.waitForURL(/\/forms$/);
      found.push(...(await scan(page, "forms (empty)")));

      await page.goto("/templates");
      found.push(...(await scan(page, "templates")));
      await page
        .getByRole("button", {
          name: /Use template: Event registration|استفاده از قالب: ثبت‌نام رویداد/,
        })
        .click();
      await page.waitForURL(/\/forms\/[^/]+$/);
      const formPath = new URL(page.url()).pathname;
      await expect(page.locator("[data-field-key]").first()).toBeVisible();
      found.push(...(await scan(page, "builder")));

      await page.getByRole("button", { name: /^(Publish|انتشار)$/ }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      found.push(...(await scan(page, "publish dialog")));
      const url = await dialog.locator("span[dir=ltr]").first().innerText();
      await page.keyboard.press("Escape");

      const visitor = await (
        await browser.newContext({
          colorScheme: scheme,
          locale: locale === "fa" ? "fa-IR" : "en-US",
        })
      ).newPage();
      await visitor.goto(url);
      found.push(...(await scan(visitor, "hosted form")));
      await visitor.goto(`${url}?embed=1`);
      found.push(...(await scan(visitor, "hosted form (embed)")));
      await visitor.close();

      for (const [path, name] of [
        ["", "forms"],
        [`${formPath}/preview`, "preview"],
        [`${formPath}/responses`, "responses"],
        [`${formPath}/analytics`, "analytics"],
        [`${formPath}/integrations`, "integrations"],
      ] as const) {
        await page.goto(path || "/forms");
        found.push(...(await scan(page, name)));
      }
      await page.goto("/f/no-such-form");
      found.push(...(await scan(page, "not found")));

      expect(found).toEqual([]);
    });
  }
}

test("the gallery and its preview work with the keyboard alone", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(`kbd-${crypto.randomUUID()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/forms$/);
  await page.goto("/templates");

  await page.getByRole("searchbox", { name: "Search templates" }).focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Feedback", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Product feedback"]);

  const trigger = page.getByRole("button", { name: "Preview Product feedback" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
