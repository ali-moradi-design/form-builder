import type { FormDocument } from "@formcanvas/schema";
import { describe, expect, it } from "vitest";
import { formatAnswer, responseColumns } from "./columns";

const v1: FormDocument = {
  schemaVersion: 1,
  id: "f",
  title: "F",
  locales: { default: "en", supported: ["en", "fa"] },
  steps: [
    {
      key: "a",
      fields: [
        { type: "shortText", key: "old", label: "Old" },
        { type: "shortText", key: "name" },
      ],
    },
  ],
};
const v2: FormDocument = {
  ...v1,
  steps: [
    {
      key: "a",
      fields: [
        { type: "shortText", key: "name", label: { en: "Name", fa: "نام" } },
        {
          type: "group",
          key: "g",
          fields: [
            {
              type: "checkboxes",
              key: "colors",
              label: "Colors",
              settings: {
                options: [{ value: "r", label: { en: "Red", fa: "قرمز" } }, { value: "b" }],
              },
            },
          ],
        },
      ],
    },
  ],
};

describe("response columns", () => {
  it("lists newest fields first, flattens groups and keeps old fields", () => {
    expect(responseColumns([v2, v1], "fa").map((c) => [c.key, c.label])).toEqual([
      ["name", "نام"],
      ["colors", "Colors"],
      ["old", "Old"],
    ]);
  });

  it("formats answers as text", () => {
    const [, colors] = responseColumns([v2], "en");
    expect(formatAnswer(colors, ["r", "b"])).toBe("Red, b");
    expect(formatAnswer(undefined, true)).toBe("Yes");
    expect(formatAnswer(undefined, 0)).toBe("0");
    expect(formatAnswer(undefined, null)).toBe("");
    expect(formatAnswer(undefined, { a: 1 })).toBe('{"a":1}');
    expect(formatAnswer(undefined, { from: "2026-03-01", to: "2026-03-04" })).toBe(
      "2026-03-01 – 2026-03-04",
    );
    expect(formatAnswer(undefined, { from: 20 })).toBe("20 – ");
    expect(
      formatAnswer(undefined, [
        { name: "Sara", age: 34 },
        { name: "Nima", child: true },
      ]),
    ).toBe("Sara / 34; Nima / Yes");
    const grid = {
      key: "feel",
      label: "Feel",
      type: "matrix",
      options: new Map([
        ["1", "Poor"],
        ["2", "Good"],
      ]),
      rows: new Map([["talks", "Talks"]]),
    };
    expect(formatAnswer(grid, { talks: "2", venue: "1" })).toBe("Talks: Good; venue: Poor");
    const pdf = { id: "f1", name: "talk.pdf", size: 10, type: "application/pdf" };
    expect(formatAnswer(undefined, [pdf, { ...pdf, id: "f2", name: "b.pdf" }])).toBe(
      "talk.pdf, b.pdf",
    );
    expect(formatAnswer(undefined, pdf)).toBe("talk.pdf");
    expect(
      formatAnswer(
        { key: "a", label: "A", type: "address" },
        { line1: "Zand St 4", city: "Shiraz", country: "IR" },
      ),
    ).toBe("Zand St 4, Shiraz, IR");
  });
});
