import { expect, test } from "@playwright/test";
import { createHmac } from "node:crypto";
import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";

interface Received {
  readonly headers: IncomingHttpHeaders;
  readonly body: string;
}

test("delivers signed events to a webhook", async ({ page }) => {
  const received: Received[] = [];
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      received.push({ headers: req.headers, body });
      res.writeHead(200).end("ok");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const hookUrl = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}/hook`;

  try {
    await page.goto("/sign-in");
    await page.getByRole("tab", { name: "Create account" }).click();
    await page.getByLabel("Email").fill(`hook-${crypto.randomUUID()}@example.com`);
    await page.getByLabel("Password").fill("correct horse battery");
    await page.locator("form").getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/forms$/);
    await page.getByRole("link", { name: /From a template/ }).click();
    await page.getByRole("button", { name: "Use template: Product feedback" }).click();
    await page.waitForURL(/\/forms\/[^/]+$/);
    const formPath = new URL(page.url()).pathname;
    await page.getByRole("button", { name: "Publish" }).click();
    const url = await page.getByRole("dialog").locator("span[dir=ltr]").innerText();
    const slug = url.split("/").pop() ?? "";

    await page.goto(`${formPath}/integrations`);
    await page.getByLabel("Endpoint URL").fill(hookUrl);
    await page.getByRole("button", { name: "Add webhook" }).click();
    await expect(page.getByText(hookUrl)).toBeVisible();
    await page.getByRole("button", { name: "Show secret" }).click();
    const secret = await page.locator("code", { hasText: "whsec_" }).innerText();

    await page.getByRole("button", { name: "Send test" }).click();
    await expect(page.getByText("Test delivered (HTTP 200).")).toBeVisible();

    const posted = await page.request.post(`/api/forms/${slug}/responses`, {
      data: { values: { name: "Sara", plan: "free", satisfaction: 5 }, locale: "en" },
    });
    expect(posted.status()).toBe(201);
    await expect.poll(() => received.length).toBe(2);

    const [ping, created] = received;
    expect(ping?.headers["x-formweave-event"]).toBe("ping");
    expect(created?.headers["x-formweave-event"]).toBe("response.created");
    const event = JSON.parse(created?.body ?? "{}") as {
      form: { slug: string };
      response: { data: unknown };
    };
    expect(event.form.slug).toBe(slug);
    expect(event.response.data).toEqual({ name: "Sara", plan: "free", satisfaction: 5 });
    const timestamp = String(created?.headers["x-formweave-timestamp"]);
    const expected = `sha256=${createHmac("sha256", secret)
      .update(`${timestamp}.${created?.body ?? ""}`)
      .digest("hex")}`;
    expect(created?.headers["x-formweave-signature"]).toBe(expected);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Recent deliveries" })).toBeVisible();
    await expect(page.getByText("response.created")).toBeVisible();
  } finally {
    server.close();
  }
});
