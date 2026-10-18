import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "../registry.js";
import { checkboxes, date, email, number, radio, shortText, toggle } from "./index.js";

const issues = <S, V>(def: FieldDefinition<S, V>, settings: unknown, value: unknown): string[] => {
  const parsed = def.settings.parse(settings);
  const r = def.validator({ settings: parsed }).safeParse(value);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe("built-in fields", () => {
  it("shortText checks length", () => {
    expect(issues(shortText, { minLength: 2 }, "a")).toEqual(["tooShort"]);
    expect(issues(shortText, {}, "a".repeat(501))).toEqual(["tooLong"]);
    expect(issues(shortText, {}, "ok")).toEqual([]);
  });

  it("email checks the address", () => {
    expect(issues(email, {}, "sara@example")).toEqual(["invalidEmail"]);
    expect(issues(email, {}, "sara@example.com")).toEqual([]);
  });

  it("number checks range and integer", () => {
    expect(issues(number, { min: 1, max: 5 }, 0)).toEqual(["tooSmall"]);
    expect(issues(number, { max: 5 }, 6)).toEqual(["tooBig"]);
    expect(issues(number, { integer: true }, 1.5)).toEqual(["notInteger"]);
    expect(issues(number, {}, "3")).toEqual(["invalidType"]);
  });

  it("radio accepts only its options", () => {
    const s = { options: [{ value: "a" }, { value: "b" }] };
    expect(issues(radio, s, "c")).toEqual(["invalidOption"]);
    expect(issues(radio, s, "a")).toEqual([]);
  });

  it("checkboxes checks options, count and duplicates", () => {
    const s = { options: [{ value: "a" }, { value: "b" }, { value: "c" }], maxSelected: 2 };
    expect(issues(checkboxes, s, ["a", "b", "c"])).toEqual(["tooMany"]);
    expect(issues(checkboxes, s, ["a", "a"])).toEqual(["duplicate"]);
    expect(issues(checkboxes, { ...s, minSelected: 1 }, [])).toEqual(["tooFew"]);
  });

  it("switch starts off and counts as empty until on", () => {
    expect(toggle.defaultValue({})).toBe(false);
    expect(toggle.isEmpty?.(false)).toBe(true);
    expect(toggle.isEmpty?.(true)).toBe(false);
  });

  it("date checks format and range", () => {
    expect(issues(date, {}, "2026-02-30")).toEqual(["invalidDate"]);
    expect(issues(date, { min: "2026-01-01" }, "2025-12-31")).toEqual(["tooEarly"]);
    expect(issues(date, { max: "2026-01-01" }, "2026-01-02")).toEqual(["tooLate"]);
    expect(issues(date, {}, "2026-10-18")).toEqual([]);
  });
});
