import { describe, expect, it } from "vitest";
import * as z from "zod/mini";
import { compile } from "./compile.js";
import { allFields } from "./fields/all.js";
import { email, number, shortText } from "./fields/index.js";
import { createRegistry, defineField } from "./registry.js";
import { validate } from "./validate.js";

// A custom type as an app would write it. `pnpm typecheck` fails if passing
// it (or single built-in types) to createRegistry stops compiling.
const postcode = defineField({
  type: "postcode",
  settings: z.object({ digits: z._default(z.number(), 10) }),
  defaultValue: () => undefined,
  validator: ({ settings }) =>
    z.string().check(z.regex(new RegExp(`^\\d{${String(settings.digits)}}$`), "invalidPostcode")),
});

describe("createRegistry", () => {
  it("takes single built-in types", () => {
    const registry = createRegistry([shortText, email, number]);
    expect([...registry.keys()]).toEqual(["shortText", "email", "number"]);
  });

  it("takes custom types next to the built-in ones", () => {
    const registry = createRegistry([...allFields, postcode]);
    const form = compile(
      {
        schemaVersion: 1,
        id: "t",
        title: "T",
        locales: { default: "en" },
        steps: [
          { key: "main", fields: [{ type: "postcode", key: "zip", settings: { digits: 5 } }] },
        ],
      },
      { registry },
    );
    expect(validate(form, { zip: "12345" }).success).toBe(true);
    expect(validate(form, { zip: "123" })).toEqual({
      success: false,
      issues: [{ key: "zip", code: "invalidPostcode", params: {} }],
    });
  });

  it("lets a later definition replace an earlier one", () => {
    const loose = defineField({ ...shortText, validator: () => z.string() });
    expect(createRegistry([shortText, loose]).get("shortText")).toBe(loose);
  });
});
