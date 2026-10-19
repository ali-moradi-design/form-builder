import type { FormDocument } from "@formweave/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { openDb, type Db } from "./client";
import {
  addResponse,
  createForm,
  deleteForm,
  getForm,
  getLiveForm,
  listForms,
  publishForm,
  saveDraft,
  slugify,
} from "./forms";
import { user } from "./schema";

const doc: FormDocument = {
  schemaVersion: 1,
  id: "x",
  title: "Job application",
  locales: { default: "en" },
  steps: [{ key: "a", fields: [{ type: "shortText", key: "name" }] }],
};

let db: Db;
beforeAll(async () => {
  db = await openDb(undefined, "memory://");
  await db.insert(user).values([
    { id: "u1", name: "Ali", email: "ali@example.com" },
    { id: "u2", name: "Sara", email: "sara@example.com" },
  ]);
}, 30_000);

describe("forms in the database", () => {
  it("keeps forms per owner", async () => {
    const id = await createForm(db, "u1", doc);
    expect((await getForm(db, "u1", id))?.draft.id).toBe(id);
    expect(await getForm(db, "u2", id)).toBeUndefined();
    expect(await saveDraft(db, "u2", id, doc)).toBe(false);
    await expect(saveDraft(db, "u1", id, { ...doc, steps: [] })).rejects.toThrow();
    expect(await saveDraft(db, "u1", id, { ...doc, title: "New" })).toBe(true);
    expect((await listForms(db, "u1")).map((f) => f.draft.title)).toContain("New");
    await deleteForm(db, "u2", id);
    expect(await getForm(db, "u1", id)).toBeDefined();
    await deleteForm(db, "u1", id);
    expect(await getForm(db, "u1", id)).toBeUndefined();
  });

  it("publishes immutable versions behind one slug", async () => {
    const id = await createForm(db, "u1", doc);
    expect(await publishForm(db, "u1", id, "Job application")).toEqual({
      version: 1,
      slug: "job-application",
    });
    await saveDraft(db, "u1", id, { ...doc, title: "Changed" });
    expect((await getLiveForm(db, "job-application"))?.document.title).toBe("Job application");
    expect(await publishForm(db, "u1", id, "Changed")).toEqual({
      version: 2,
      slug: "job-application",
    });
    const live = await getLiveForm(db, "job-application");
    expect(live?.version).toBe(2);
    expect(live?.document.title).toBe("Changed");

    const other = await createForm(db, "u2", doc);
    const second = await publishForm(db, "u2", other, "Job application");
    expect(second?.slug).toMatch(/^job-application-[0-9a-f]{6}$/);
    expect(await publishForm(db, "u1", other, "x")).toBeUndefined();
  });

  it("stores responses with their version and counts them", async () => {
    const id = await createForm(db, "u2", doc);
    const { slug } = (await publishForm(db, "u2", id, "فرم")) ?? { slug: "" };
    expect(slug).toMatch(/^form-[0-9a-f]{6}$/);
    const live = await getLiveForm(db, slug);
    if (!live) throw new Error("not live");
    await addResponse(db, {
      formId: id,
      versionId: live.versionId,
      data: { name: "Sara" },
      locale: "fa",
    });
    const mine = await listForms(db, "u2");
    expect(mine.find((f) => f.id === id)?.responses).toBe(1);
  });

  it("makes URL slugs", () => {
    expect(slugify("  Café — Sign-up 2026! ")).toBe("cafe-sign-up-2026");
    expect(slugify("نظرسنجی")).toBe("");
  });
});
