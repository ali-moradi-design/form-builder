import { compile, createRegistry, validate } from "@formcanvas/engine";
import { allFields } from "@formcanvas/engine/fields/all";
import { beforeAll, describe, expect, it } from "vitest";
import { feedbackTemplate } from "@/shared/config";
import { createForm, listForms, openDb, tables, type Db } from "@/shared/db";
import { DEMO_EMAIL, resetDemo, sampleFeedback } from "./reset-demo";

let db: Db;
beforeAll(async () => {
  db = await openDb(undefined, "memory://");
}, 30_000);

describe("demo reset", () => {
  it("writes sample answers the engine accepts", () => {
    const form = compile(feedbackTemplate, { registry: createRegistry(allFields) });
    for (let n = 0; n < 30; n++) {
      const result = validate(form, sampleFeedback(n));
      expect(result.success, JSON.stringify(result)).toBe(true);
    }
  });

  it("does nothing before the demo account exists", async () => {
    expect(await resetDemo(db)).toEqual({ reset: false });
  });

  it("replaces the demo forms and keeps other accounts", async () => {
    await db.insert(tables.user).values([
      { id: "demo", name: "Demo", email: DEMO_EMAIL },
      { id: "other", name: "Sara", email: "sara@example.com" },
    ]);
    await createForm(db, "demo", { ...feedbackTemplate, title: "Visitor's form" });
    await createForm(db, "other", feedbackTemplate);
    await db.insert(tables.session).values({
      id: "s1",
      token: "t1",
      userId: "demo",
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(await resetDemo(db)).toEqual({ reset: true });
    const forms = await listForms(db, "demo");
    expect(forms.map((f) => f.draft.title)).not.toContainEqual("Visitor's form");
    expect(forms).toHaveLength(3);
    expect(forms.find((f) => f.liveVersion === 1)?.responses).toBe(24);
    expect(await listForms(db, "other")).toHaveLength(1);
    expect(await db.select().from(tables.session)).toEqual([]);

    await resetDemo(db);
    expect(await listForms(db, "demo")).toHaveLength(3);
  });
});
