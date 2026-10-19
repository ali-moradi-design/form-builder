import type { FormDocument } from "@formweave/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { openDb, type Db } from "./client";
import { addResponse, createForm, getLiveForm, publishForm, saveDraft } from "./forms";
import { deleteResponses, listResponses, listVersions } from "./responses";
import { user } from "./schema";

const doc: FormDocument = {
  schemaVersion: 1,
  id: "x",
  title: "Poll",
  locales: { default: "en" },
  steps: [{ key: "a", fields: [{ type: "shortText", key: "name" }] }],
};

let db: Db;
let formId = "";
beforeAll(async () => {
  db = await openDb(undefined, "memory://");
  await db.insert(user).values([
    { id: "u1", name: "A", email: "a@example.com" },
    { id: "u2", name: "B", email: "b@example.com" },
  ]);
  formId = await createForm(db, "u1", doc);
  await publishForm(db, "u1", formId, "Poll");
  const v1 = await getLiveForm(db, "poll");
  for (const name of ["a", "b", "c"]) {
    await addResponse(db, { formId, versionId: v1?.versionId ?? "", data: { name } });
  }
  await saveDraft(db, "u1", formId, { ...doc, title: "Poll 2" });
  await publishForm(db, "u1", formId, "Poll");
  const v2 = await getLiveForm(db, "poll");
  await addResponse(db, { formId, versionId: v2?.versionId ?? "", data: { name: "d" } });
}, 30_000);

describe("responses in the database", () => {
  it("lists versions only for the owner", async () => {
    expect((await listVersions(db, "u1", formId)).map((v) => v.version)).toEqual([2, 1]);
    expect(await listVersions(db, "u2", formId)).toEqual([]);
  });

  it("pages and filters responses", async () => {
    const all = await listResponses(db, "u1", formId, {}, { limit: 2, offset: 0 });
    expect(all?.total).toBe(4);
    expect(all?.rows).toHaveLength(2);
    expect(all?.rows[0]?.data).toEqual({ name: "d" });
    const v1 = await listResponses(db, "u1", formId, { version: 1 });
    expect(v1?.total).toBe(3);
    const future = await listResponses(db, "u1", formId, { from: new Date(Date.now() + 60_000) });
    expect(future?.total).toBe(0);
    expect(await listResponses(db, "u2", formId)).toBeNull();
  });

  it("deletes only the owner's responses", async () => {
    const page = await listResponses(db, "u1", formId);
    const ids = page?.rows.slice(0, 2).map((r) => r.id) ?? [];
    expect(await deleteResponses(db, "u2", formId, ids)).toBe(0);
    expect(await deleteResponses(db, "u1", formId, ids)).toBe(2);
    expect((await listResponses(db, "u1", formId))?.total).toBe(2);
  });
});
