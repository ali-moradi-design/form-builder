import type { FieldNode, FormDocument } from "@formweave/schema";
import { describe, expect, it } from "vitest";
import { dropField, placeForNew } from "./actions";
import { fieldPatch, fieldSettingsDocument, formPatch, readText } from "./settings";

const doc: FormDocument = {
  schemaVersion: 1,
  id: "f",
  title: { en: "Form", fa: "فرم" },
  locales: { default: "en", supported: ["en", "fa"] },
  steps: [
    {
      key: "one",
      fields: [
        { type: "number", key: "age", label: { en: "Age" }, settings: { min: 1 } },
        { type: "group", key: "box", fields: [{ type: "shortText", key: "inner" }] },
      ],
    },
    { key: "two", fields: [] },
  ],
};
const t = (k: string) => k;
const age = doc.steps[0]?.fields[0] as FieldNode;

describe("settings panel mapping", () => {
  it("builds values from a field", () => {
    const { document, values } = fieldSettingsDocument(age, doc, t, t);
    expect(document.steps[0]?.fields.map((f) => f.key)).toEqual([
      "label_en",
      "label_fa",
      "placeholder_en",
      "placeholder_fa",
      "help_en",
      "help_fa",
      "key",
      "required",
      "half",
      "min",
      "max",
      "integer",
    ]);
    expect(values).toMatchObject({
      label_en: "Age",
      label_fa: "",
      key: "age",
      min: 1,
      integer: false,
    });
  });

  it("turns values back into a patch and drops empty ones", () => {
    const patch = fieldPatch(
      age,
      {
        label_en: "Age",
        label_fa: "سن",
        placeholder_en: "",
        help_en: "",
        required: true,
        half: false,
        min: undefined,
        max: 99,
        integer: true,
      },
      ["en", "fa"],
    );
    expect(patch).toEqual({
      label: { en: "Age", fa: "سن" },
      placeholder: undefined,
      help: undefined,
      required: true,
      width: undefined,
      settings: { max: 99, integer: true },
    });
  });

  it("uses a plain string for single-language forms", () => {
    expect(readText({ title_en: "Hi" }, "title", ["en"])).toBe("Hi");
    expect(readText({ title_en: "" }, "title", ["en"])).toBeUndefined();
  });

  it("keeps the default language among the chosen ones", () => {
    expect(formPatch(doc, { title_en: "Form", languages: ["fa"], default: "en" }).locales).toEqual({
      default: "fa",
      supported: ["fa"],
    });
    expect(formPatch(doc, { title_en: "", languages: [], default: "fa" })).toMatchObject({
      title: { fa: "فرم" },
      locales: { default: "fa", supported: ["en", "fa"] },
    });
  });

  it("places new fields after the selection, inside a selected group, or at the end", () => {
    expect(placeForNew(doc, { kind: "field", key: "age" })).toEqual({
      step: "one",
      parent: undefined,
      index: 1,
    });
    expect(placeForNew(doc, { kind: "field", key: "box" })).toEqual({
      step: "one",
      parent: "box",
      index: 1,
    });
    expect(placeForNew(doc, { kind: "step", key: "one" })).toEqual({ step: "one", index: 2 });
    expect(placeForNew(doc, { kind: "form" })).toEqual({ step: "two", index: 0 });
  });

  it("drops a field into a slot, counting slots before the move", () => {
    const order = (d: FormDocument) => d.steps.map((s) => s.fields.map((f) => f.key));
    expect(order(dropField(doc, "age", { step: "one", index: 2 }))).toEqual([["box", "age"], []]);
    expect(dropField(doc, "age", { step: "one", index: 1 })).toBe(doc);
    expect(order(dropField(doc, "box", { step: "two", index: 0 }))).toEqual([["age"], ["box"]]);
    expect(dropField(doc, "box", { step: "one", parent: "box", index: 0 })).toBe(doc);
  });
});
