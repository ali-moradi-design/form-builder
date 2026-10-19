import type { FieldNode, FormDocument } from "@formweave/schema";
import { parseFormDocument } from "@formweave/schema/meta";
import { describe, expect, it } from "vitest";
import {
  addStep,
  allFields,
  findField,
  insertField,
  moveField,
  moveStep,
  removeField,
  removeStep,
  renameField,
  uniqueKey,
  updateField,
  updateStep,
} from "./commands";

const isTeam = { op: "eq", args: [{ var: "plan" }, "team"] } as const;

const doc: FormDocument = {
  schemaVersion: 1,
  id: "f",
  title: "Form",
  locales: { default: "en" },
  steps: [
    {
      key: "one",
      fields: [
        { type: "shortText", key: "name" },
        { type: "radio", key: "plan" },
        { type: "number", key: "seats", visibleWhen: isTeam, requiredWhen: isTeam },
      ],
    },
    {
      key: "two",
      visibleWhen: isTeam,
      fields: [{ type: "group", key: "address", fields: [{ type: "shortText", key: "city" }] }],
    },
  ],
};

const keys = (d: FormDocument): string[] => allFields(d).map((f) => f.field.key);
const valid = (d: FormDocument): boolean => parseFormDocument(d).success;

describe("form commands", () => {
  it("finds nested fields with their place", () => {
    expect(findField(doc, "city")?.place).toEqual({ step: "two", parent: "address", index: 0 });
  });

  it("makes unused, safe keys", () => {
    expect(uniqueKey(doc, "name")).toBe("name2");
    expect(uniqueKey(doc, "one")).toBe("one2");
    expect(uniqueKey(doc, "e-mail")).toBe("e_mail");
    expect(uniqueKey(doc, "1st")).toBe("_1st");
  });

  it("inserts into a step or a group and rejects duplicate keys", () => {
    const email: FieldNode = { type: "email", key: "email" };
    expect(keys(insertField(doc, email, { step: "one", index: 1 }))).toEqual([
      "name",
      "email",
      "plan",
      "seats",
      "address",
      "city",
    ]);
    expect(keys(insertField(doc, email, { step: "two", parent: "address", index: 9 }))).toEqual([
      "name",
      "plan",
      "seats",
      "address",
      "city",
      "email",
    ]);
    expect(() =>
      insertField(doc, { type: "email", key: "city" }, { step: "one", index: 0 }),
    ).toThrow();
  });

  it("does not change the input", () => {
    const before = JSON.stringify(doc);
    removeField(moveField(doc, "name", { step: "two", index: 0 }), "plan");
    expect(JSON.stringify(doc)).toBe(before);
  });

  it("removes conditions that read a removed field", () => {
    const out = removeField(doc, "plan");
    expect(findField(out, "seats")?.field).toEqual({ type: "number", key: "seats" });
    expect(out.steps[1]?.visibleWhen).toBeUndefined();
    expect(valid(out)).toBe(true);
  });

  it("removes a group with its children", () => {
    expect(keys(removeField(doc, "address"))).toEqual(["name", "plan", "seats"]);
  });

  it("moves fields across steps and into groups, but not a group into itself", () => {
    expect(keys(moveField(doc, "name", { step: "two", parent: "address", index: 1 }))).toEqual([
      "plan",
      "seats",
      "address",
      "city",
      "name",
    ]);
    expect(keys(moveField(doc, "name", { step: "one", index: 2 }))).toEqual([
      "plan",
      "seats",
      "name",
      "address",
      "city",
    ]);
    expect(moveField(doc, "address", { step: "two", parent: "address", index: 0 })).toBe(doc);
  });

  it("updates props and removes props set to undefined", () => {
    const out = updateField(doc, "seats", { label: "Seats", visibleWhen: undefined });
    expect(findField(out, "seats")?.field).toEqual({
      type: "number",
      key: "seats",
      requiredWhen: isTeam,
      label: "Seats",
    });
  });

  it("renames a field and the conditions that read it", () => {
    const out = renameField(doc, "plan", "tier");
    expect(findField(out, "seats")?.field.visibleWhen).toEqual({
      op: "eq",
      args: [{ var: "tier" }, "team"],
    });
    expect(out.steps[1]?.visibleWhen).toEqual({ op: "eq", args: [{ var: "tier" }, "team"] });
    expect(valid(out)).toBe(true);
    expect(renameField(doc, "plan", "name")).toBe(doc);
    expect(renameField(doc, "plan", "one")).toBe(doc);
  });

  it("adds, moves, edits and removes steps but keeps one", () => {
    const added = addStep(doc, { key: "three", title: "Three" }, 0);
    expect(added.steps.map((s) => s.key)).toEqual(["three", "one", "two"]);
    expect(moveStep(added, "three", 2).steps.map((s) => s.key)).toEqual(["one", "two", "three"]);
    expect(updateStep(doc, "two", { title: "Two" }).steps[1]?.title).toBe("Two");
    const removed = removeStep(doc, "one");
    expect(keys(removed)).toEqual(["address", "city"]);
    expect(valid(removed)).toBe(true);
    expect(removeStep(removed, "two")).toBe(removed);
  });
});
