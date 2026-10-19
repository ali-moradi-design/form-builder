import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("uploads a file on the hosted page and downloads it from the responses", async ({
  page,
  browser,
}) => {
  await page.goto("/sign-in");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(`up-${crypto.randomUUID()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/forms$/);
  await page.getByRole("button", { name: /Blank form/ }).click();
  await page.waitForURL(/\/forms\/[^/]+$/);
  await page.getByRole("button", { name: "Add File upload" }).click();
  await page.getByLabel("Label · English").fill("Your slides");
  await page.getByLabel("Allowed files").fill(".pdf");
  await page.getByRole("switch", { name: "Required" }).click();
  await expect(page.getByRole("status").first()).toHaveText("Saved");
  await page.getByRole("button", { name: "Publish" }).click();
  const dialog = page.getByRole("dialog", { name: "Version 1 is live" });
  const url = await dialog.locator("span[dir=ltr]").innerText();
  await dialog.getByRole("button", { name: "Done" }).click();

  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(url);
  const input = visitor.getByLabel(/^Your slides/);
  await input.setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hi"),
  });
  await expect(visitor.getByText("notes.txt is not an allowed type.")).toBeVisible();
  await input.setInputFiles({
    name: "talk.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7 a tiny talk"),
  });
  await expect(visitor.getByText(/Saved/)).toBeVisible();
  const results = await new AxeBuilder({ page: visitor }).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await visitor.getByRole("button", { name: "Submit" }).click();
  await expect(visitor.getByRole("heading", { name: "Thank you!" })).toBeVisible();

  // A PNG that calls itself a PDF is refused by the server.
  const slug = new URL(url).pathname.split("/").pop() ?? "";
  const fake = await page.request.post(`/api/forms/${slug}/uploads?field=files`, {
    multipart: {
      file: {
        name: "fake.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]),
      },
    },
  });
  expect(fake.status()).toBe(415);

  await page.getByRole("link", { name: "Responses" }).click();
  await page.getByRole("button", { name: /\d{4}/ }).first().click();
  const link = page.getByRole("dialog").getByRole("link", { name: "talk.pdf" });
  const href = (await link.getAttribute("href")) ?? "";
  const file = await page.request.get(href);
  expect(file.status()).toBe(200);
  expect(file.headers()["content-disposition"]).toContain("attachment");
  expect(await file.text()).toBe("%PDF-1.7 a tiny talk");
  // Not for anyone else.
  expect((await visitor.request.get(href)).status()).toBe(404);
});
