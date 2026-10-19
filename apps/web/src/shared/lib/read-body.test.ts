import { describe, expect, it } from "vitest";
import { readBody } from "./read-body";

const stream = (parts: number, size: number) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (let i = 0; i < parts; i++) c.enqueue(new Uint8Array(size));
      c.close();
    },
  });

describe("readBody", () => {
  it("reads a body within the limit", async () => {
    const body = await readBody(new Request("http://x", { method: "POST", body: "hello" }), 10);
    expect(new TextDecoder().decode(body ?? undefined)).toBe("hello");
  });

  it("refuses a declared length over the limit without reading", async () => {
    const request = new Request("http://x", {
      method: "POST",
      body: "x",
      headers: { "content-length": "999999" },
    });
    expect(await readBody(request, 10)).toBeNull();
  });

  it("stops a streamed body without a length once it passes the limit", async () => {
    const request = new Request("http://x", {
      method: "POST",
      body: stream(1000, 1024),
      duplex: "half",
    } as RequestInit);
    expect(await readBody(request, 64 * 1024)).toBeNull();
  });
});
