import { afterEach, describe, expect, it, vi } from "vitest";
import { postJson, publicOnlyLookup } from "./post";
import { deliver } from "./deliver";
import { checkWebhookUrl, isPrivateAddress } from "./guard";
import { newSecret, sign, verify } from "./sign";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("webhook signing", () => {
  it("signs and verifies", () => {
    const secret = newSecret();
    expect(secret).toMatch(/^whsec_[\w-]{43}$/);
    const sig = sign(secret, 100, '{"a":1}');
    expect(verify(secret, 100, '{"a":1}', sig)).toBe(true);
    expect(verify(secret, 101, '{"a":1}', sig)).toBe(false);
    expect(verify("other", 100, '{"a":1}', sig)).toBe(false);
  });
});

describe("webhook address guard", () => {
  it("knows private addresses", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ["8.8.8.8", "172.32.0.1", "2606:4700::1111"])
      expect(isPrivateAddress(ip), ip).toBe(false);
  });

  it("allows only public https addresses", async () => {
    expect(await checkWebhookUrl("not a url")).toBe("invalid");
    expect(await checkWebhookUrl("https://user:pw@example.com")).toBe("invalid");
    expect(await checkWebhookUrl("http://8.8.8.8/hook")).toBe("protocol");
    expect(await checkWebhookUrl("https://127.0.0.1/hook")).toBe("private");
    expect(await checkWebhookUrl("https://[::1]/hook")).toBe("private");
    expect(await checkWebhookUrl("https://169.254.169.254/latest")).toBe("private");
    expect(await checkWebhookUrl("https://8.8.8.8/hook")).toBeNull();
    vi.stubEnv("WEBHOOK_ALLOW_PRIVATE", "1");
    expect(await checkWebhookUrl("http://localhost:4000/hook")).toBeNull();
  });
});

describe("webhook delivery", () => {
  const target = { url: "https://8.8.8.8/hook", secret: "s" };

  it("sends a signed request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(() =>
      Promise.resolve(new Response("ok", { status: 200 })),
    );
    const result = await deliver(
      target,
      "response.created",
      { a: 1 },
      { fetch: fetch, now: () => 5000 },
    );
    expect(result).toMatchObject({ ok: true, status: 200, attempt: 1 });
    const init = fetch.mock.calls[0]?.[1];
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-Formcanvas-Signature"]).toBe(sign("s", 5, '{"a":1}'));
  });

  it("retries server errors but not client errors", async () => {
    const statuses = [500, 429, 200];
    const fetch = vi.fn(() =>
      Promise.resolve(new Response("", { status: statuses.shift() ?? 200 })),
    );
    const attempts: number[] = [];
    const sleep = vi.fn(() => Promise.resolve());
    const result = await deliver(
      target,
      "e",
      {},
      {
        fetch: fetch as unknown as typeof globalThis.fetch,
        sleep,
        onAttempt: (a) => {
          attempts.push(a.status ?? 0);
        },
      },
    );
    expect(result.ok).toBe(true);
    expect(attempts).toEqual([500, 429, 200]);
    expect(sleep).toHaveBeenCalledTimes(2);

    const notFound = vi.fn(() => Promise.resolve(new Response("", { status: 404 })));
    expect(
      await deliver(
        target,
        "e",
        {},
        { fetch: notFound as unknown as typeof globalThis.fetch, sleep },
      ),
    ).toMatchObject({ ok: false, status: 404, attempt: 1 });
  });

  it("refuses private targets without sending", async () => {
    const fetch = vi.fn();
    const result = await deliver(
      { url: "https://10.0.0.1/x", secret: "s" },
      "e",
      {},
      { fetch: fetch as unknown as typeof globalThis.fetch },
    );
    expect(result).toMatchObject({ ok: false, error: "blocked: private" });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("connecting to webhooks", () => {
  it("refuses a name that resolves to a private address at connect time", async () => {
    vi.stubEnv("WEBHOOK_ALLOW_PRIVATE", "");
    // "localhost" passes no URL check here: this is the lookup the socket itself uses.
    const found = await new Promise<string>((resolve) => {
      publicOnlyLookup("localhost", {}, (error) => {
        resolve(error?.message ?? "connected");
      });
    });
    expect(found).toMatch(/blocked/);
    await expect(postJson("http://localhost:9/", { headers: {}, body: "{}" })).rejects.toThrow(
      /blocked/,
    );
    vi.unstubAllEnvs();
  });
});
