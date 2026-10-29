import { expect, test } from "@playwright/test";

test("embeds a published form on another page with one script tag", async ({ page, browser }) => {
  test.setTimeout(60_000);
  await page.goto("/sign-in");
  await page.getByRole("tab", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(`embed-${crypto.randomUUID()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.locator("form").getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/forms$/);
  await page.getByRole("button", { name: /Blank form/ }).click();
  await page.waitForURL(/\/forms\/[^/]+$/);
  await page.getByRole("button", { name: "Add Short text" }).click();
  await page.getByLabel("Label · English").fill("Your city");
  await expect(page.getByRole("status").first()).toHaveText("Saved");

  // The builder refuses to be framed; published forms don't.
  const builder = await page.request.get(page.url());
  expect(builder.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");

  await page.getByRole("button", { name: "Publish" }).click();
  const dialog = page.getByRole("dialog", { name: "Version 1 is live" });
  const url = await dialog.locator("span[dir=ltr]").innerText();
  await dialog.getByRole("button", { name: /Embed/ }).click();
  const code = await dialog.getByLabel("Embed").innerText();
  expect(code).toMatch(
    /^<script src="http:\/\/[^"]+\/embed\.js" data-form="[a-z0-9-]+" async><\/script>$/,
  );
  const hosted = await page.request.get(url);
  expect(hosted.headers()["content-security-policy"]).toContain("frame-ancestors *");

  // A plain page with only the snippet. (Browsers block a public page from
  // loading a script from localhost, so the test page is served on the app's
  // address; the frame and messages work the same.)
  const site = await (await browser.newContext()).newPage();
  await site.route("**/__shop", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><title>Shop</title><h1>Shop</h1>${code}<p id="after">After</p>
        <script>document.addEventListener("formcanvas:submitted", () => { document.title = "sent"; });</script>`,
    }),
  );
  await site.goto("/__shop", { waitUntil: "domcontentloaded" });
  const frame = site.frameLocator("iframe[title=Form]");
  await frame.getByLabel("Your city").fill("Shiraz");
  // The frame grows with the form.
  await expect
    .poll(async () => (await site.locator("iframe").boundingBox())?.height ?? 0)
    .toBeGreaterThan(200);
  await frame.getByRole("button", { name: "Submit" }).click();
  await expect(frame.getByRole("heading", { name: "Thank you!" })).toBeVisible();
  await expect(site).toHaveTitle("sent");
});
