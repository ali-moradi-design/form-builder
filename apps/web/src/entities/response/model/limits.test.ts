import type { FormDocument } from "@formcanvas/schema";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createForm, openDb, publishForm, tables, type Db } from "@/shared/db";

// Small quotas so the tests can reach them; read when the modules load.
vi.stubEnv("UPLOAD_PENDING_MB", "0.001"); // about 1 KB
vi.stubEnv("MAX_RESPONSES_PER_FORM", "2");
vi.stubEnv("UPLOAD_RATE_LIMIT", "1000");
vi.stubEnv("SUBMIT_RATE_LIMIT", "1000");
const { acceptResponse } = await import("./accept");
const { receiveUpload } = await import("./upload");
const { clientIp } = await import("./submit");

const doc: FormDocument = {
  schemaVersion: 1,
  id: "x",
  title: "Limits",
  locales: { default: "en" },
  steps: [
    {
      key: "a",
      fields: [
        { type: "shortText", key: "name" },
        { type: "file", key: "doc", settings: { accept: [".pdf"] } },
      ],
    },
  ],
};
const PDF = new TextEncoder().encode(`%PDF-1.7 ${"x".repeat(400)}`);

let db: Db;
beforeAll(async () => {
  db = await openDb(undefined, "memory://");
  await db.insert(tables.user).values({ id: "u", name: "U", email: "u@example.com" });
  await publishForm(db, "u", await createForm(db, "u", doc), "Limits");
}, 30_000);

describe("limits for anonymous visitors", () => {
  it("trusts only the address the proxy sets", () => {
    const h = (init: Record<string, string>) => clientIp(new Headers(init));
    expect(h({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" })).toBe("9.9.9.9");
    // A client-sent first entry is ignored; the proxy appends the real one last.
    expect(h({ "x-forwarded-for": "1.1.1.1, 9.9.9.9" })).toBe("9.9.9.9");
    expect(h({})).toBe("unknown");
  });

  it("stops pending uploads at the form's quota", async () => {
    const send = () =>
      receiveUpload(db, {
        slug: "limits",
        field: "doc",
        ip: "1.2.3.4",
        name: "a.pdf",
        type: "application/pdf",
        data: PDF,
      });
    expect((await send()).ok).toBe(true);
    expect((await send()).ok).toBe(true);
    expect(await send()).toEqual({ ok: false, reason: "quota" });
  });

  it("stops responses at the form's cap", async () => {
    expect((await acceptResponse(db, "limits", { name: "a" })).ok).toBe(true);
    expect((await acceptResponse(db, "limits", { name: "b" })).ok).toBe(true);
    expect(await acceptResponse(db, "limits", { name: "c" })).toEqual({
      ok: false,
      reason: "full",
    });
  });
});
