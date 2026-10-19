import { parseFormDocument } from "@formweave/schema/meta";
import { describe, expect, it } from "vitest";
import { compile } from "./compile.js";
import { allFields } from "./fields/all.js";
import { inferFields, inferForm, labelFromKey } from "./infer.js";
import { createRegistry } from "./registry.js";
import { validate } from "./validate.js";

const sample = {
  name: "Sara Ahmadi",
  email: "sara@example.com",
  joined: "2026-03-14",
  brandColor: "#0f4c5c",
  seats: 12,
  price: 9.5,
  newsletter: true,
  bio: "x".repeat(120),
  site: "https://example.com",
  address: { city: "Tehran", postalCode: "12345" },
  shareholders: [
    { name: "Ali", share: 60 },
    { name: "Mina", share: 40.5, note: "founder" },
  ],
  topics: ["ux", "a11y"],
  palette: ["#000", "#ffffff"],
  "2nd phone": "+98 912 123 4567",
  empty: null,
};

describe("infer", () => {
  it("guesses types, keys and labels", () => {
    const fields = inferFields(sample);
    expect(fields.map((f) => [f.key, f.type])).toEqual([
      ["name", "shortText"],
      ["email", "email"],
      ["joined", "date"],
      ["brandColor", "color"],
      ["seats", "number"],
      ["price", "number"],
      ["newsletter", "switch"],
      ["bio", "longText"],
      ["site", "url"],
      ["address", "group"],
      ["shareholders", "repeater"],
      ["topics", "tags"],
      ["palette", "colorSet"],
      ["_2nd_phone", "phone"],
    ]);
    expect(fields[4]?.settings).toEqual({ integer: true });
    expect(fields[5]?.settings).toBeUndefined();
    expect(fields[3]?.label).toBe("Brand color");
    const rows = fields.find((f) => f.key === "shareholders")?.fields ?? [];
    // Keys of all rows; a key used above gets the parent's prefix; 40.5 is not whole.
    expect(rows.map((f) => [f.key, f.type, f.settings])).toEqual([
      ["shareholders_name", "shortText", undefined],
      ["share", "number", undefined],
      ["note", "shortText", undefined],
    ]);
    expect(labelFromKey("postal_code")).toBe("Postal code");
  });

  it("makes a valid form that accepts the sample's simple values", () => {
    const doc = inferForm(sample, "Signup");
    expect(() => parseFormDocument(doc)).not.toThrow();
    const form = compile(doc, { registry: createRegistry(allFields) });
    const r = validate(form, {
      name: "Sara",
      seats: 12,
      joined: "2026-03-14",
      brandColor: "#0f4c5c",
    });
    expect(r.success).toBe(true);
    expect(inferFields([{ a: 1 }, { a: 2.5, b: "x" }]).map((f) => f.key)).toEqual(["a", "b"]);
    expect(inferFields("nope")).toEqual([]);
  });
});
