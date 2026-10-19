import type { FormDocument } from "@formweave/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { createForm, openDb, publishForm, tables, type Db } from "@/shared/db";
import { acceptResponse } from "./accept";

const doc: FormDocument = {
  schemaVersion: 1,
  id: "x",
  title: "Signup",
  locales: { default: "en", supported: ["en", "fa"] },
  steps: [
    {
      key: "a",
      fields: [
        { type: "shortText", key: "name", required: true },
        {
          type: "number",
          key: "seats",
          visibleWhen: { op: "eq", args: [{ var: "name" }, "team"] },
        },
      ],
    },
  ],
};

let db: Db;
beforeAll(async () => {
  db = await openDb(undefined, "memory://");
  await db.insert(tables.user).values({ id: "u", name: "U", email: "u@example.com" });
  const id = await createForm(db, "u", doc);
  await publishForm(db, "u", id, "Signup");
}, 30_000);

describe("accepting responses", () => {
  it("rejects unknown forms and invalid answers", async () => {
    expect(await acceptResponse(db, "nope", {})).toEqual({ ok: false, reason: "notFound" });
    const bad = await acceptResponse(db, "signup", { name: "" });
    expect(bad.ok).toBe(false);
    if (!bad.ok && bad.reason === "invalid")
      expect(bad.issues[0]).toMatchObject({ key: "name", code: "required" });
  });

  it("stores only clean data of visible fields", async () => {
    const ok = await acceptResponse(
      db,
      "signup",
      { name: "Sara", seats: 4, extra: "<script>" },
      "xx",
    );
    expect(ok).toMatchObject({ ok: true, version: 1 });
    const [row] = await db.select().from(tables.response);
    expect(row?.data).toEqual({ name: "Sara" });
    expect(row?.locale).toBe("en");
  });
});
