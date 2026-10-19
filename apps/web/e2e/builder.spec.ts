import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Creates a fresh account, so tests don't share forms. */
const signUp = async (page: Page) => {
  await page.goto("/sign-in");
  await page.getByRole("tab", { name: /Create account|ساخت حساب/ }).click();
  await page.getByLabel(/^(Email|ایمیل)$/).fill(`user-${crypto.randomUUID()}@example.com`);
  await page.getByLabel(/^(Password|گذرواژه)$/).fill("correct horse battery");
  await page
    .locator("form")
    .getByRole("button", { name: /Create account|ساخت حساب/ })
    .click();
  await page.waitForURL(/\/forms$/);
};

const newForm = async (page: Page, kind: RegExp) => {
  await signUp(page);
  await page.getByRole("button", { name: kind }).click();
  await page.waitForURL(/\/forms\/[^/]+$/);
};

test("builds a form, previews it and submits", async ({ page }) => {
  await newForm(page, /Blank form/);
  await page.getByRole("button", { name: "Add Short text" }).click();
  await page.getByLabel("Label · English").fill("Favourite colour");
  await page.getByRole("switch", { name: "Required" }).click();
  await expect(page.getByRole("main").getByLabel("Favourite colour")).toBeVisible();
  await expect(page.getByRole("status").first()).toHaveText("Saved");

  await page.getByRole("link", { name: "Preview" }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("This field is required.")).toBeVisible();
  await page.getByLabel("Favourite colour").fill("Teal");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText('"text": "Teal"')).toBeVisible();
});

test("moves, undoes and keeps edits after a reload", async ({ page }) => {
  await newForm(page, /From a template/);
  const keys = page.locator("[data-field-key]");
  await expect(keys.first()).toHaveAttribute("data-field-key", "name");
  await keys.first().click();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(keys.first()).toHaveAttribute("data-field-key", "email");
  await page.keyboard.press("Control+z");
  await expect(keys.first()).toHaveAttribute("data-field-key", "name");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(keys.first()).toHaveAttribute("data-field-key", "email");
  await expect(page.getByRole("status").first()).toHaveText("Saved");
  await page.reload();
  await expect(keys.first()).toHaveAttribute("data-field-key", "email");
});

test("logic editor writes a condition", async ({ page }) => {
  await newForm(page, /From a template/);
  await page.locator('[data-field-key="comment"]').click();
  const logic = page.getByRole("region", { name: "Logic" });
  await logic
    .getByRole("group", { name: "Show this question" })
    .getByRole("button", { name: "When…" })
    .click();
  await logic.getByRole("combobox", { name: "Field", exact: true }).selectOption("satisfaction");
  await logic.getByRole("combobox", { name: "Comparison" }).selectOption("lte");
  await logic.getByRole("spinbutton", { name: "Value" }).fill("2");
  await expect(logic.getByText(/Shown when/)).toContainText("is at most 2");
  await expect(page.getByRole("status").first()).toHaveText("Saved");

  await page.getByRole("tab", { name: "JSON" }).click();
  await expect(page.getByText("Valid schema")).toBeVisible({ timeout: 30_000 });
  const editorText = () =>
    page.evaluate(() => {
      const w = window as unknown as {
        monaco?: { editor: { getModels: () => { getValue: () => string }[] } };
      };
      return w.monaco?.editor.getModels()[0]?.getValue() ?? "";
    });
  await expect
    .poll(async () => (await editorText()).replace(/\s+/g, ""))
    .toContain('"visibleWhen":{"op":"lte","args":[{"var":"satisfaction"},2]}');
});

test("renaming a key updates the conditions that read it", async ({ page }) => {
  await newForm(page, /From a template/);
  await page.locator('[data-field-key="plan"]').click();
  await page.getByLabel(/^Key/).fill("tier");
  await page.getByRole("tab", { name: "JSON" }).click();
  await expect(page.getByText("Valid schema")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("status").first()).toHaveText("Saved");
  await page.reload();
  await page.getByRole("tab", { name: "JSON" }).click();
  await expect(page.getByText("Valid schema")).toBeVisible({ timeout: 30_000 });
  const editorText = () =>
    page.evaluate(() => {
      const w = window as unknown as {
        monaco?: { editor: { getModels: () => { getValue: () => string }[] } };
      };
      return w.monaco?.editor.getModels()[0]?.getValue() ?? "";
    });
  await expect.poll(editorText).toContain('"var": "tier"');
  expect(await editorText()).not.toContain('"plan"');
});

test("drags a field from the palette onto the canvas", async ({ page }) => {
  await newForm(page, /Blank form/);
  const source = page.getByRole("button", { name: "Add Email" });
  const box = await source.boundingBox();
  if (!box) throw new Error("no palette item");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 40, box.y + 40, { steps: 5 });
  const slot = page.locator("[data-drop-slot]").first();
  const target = await slot.boundingBox();
  if (!target) throw new Error("no slot");
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator("[data-field-key]")).toHaveAttribute("data-field-key", "email");
});

for (const locale of ["en", "fa"]) {
  test(`builder has no accessibility violations (${locale})`, async ({ page, context }) => {
    await context.addCookies([{ name: "locale", value: locale, url: "http://localhost:3200" }]);
    await newForm(page, locale === "fa" ? /از روی الگو/ : /From a template/);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "fa" ? "rtl" : "ltr");
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      ),
    ).toEqual([]);
  });
}
