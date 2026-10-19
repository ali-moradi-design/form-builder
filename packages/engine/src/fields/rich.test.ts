import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "../registry.js";
import {
  dateTime,
  hidden,
  normalizePhone,
  nps,
  phone,
  rating,
  slider,
  time,
  url,
} from "./index.js";

const issues = <S, V>(def: FieldDefinition<S, V>, settings: unknown, value: unknown): string[] => {
  const parsed = def.settings.parse(settings);
  const r = def.validator({ settings: parsed }).safeParse(value);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe("rich fields", () => {
  it("url accepts http(s) addresses with a domain", () => {
    expect(issues(url, {}, "https://example.com/a?b=1")).toEqual([]);
    expect(issues(url, {}, "example.com")).toEqual(["invalidUrl"]);
    expect(issues(url, {}, "javascript:alert(1)")).toEqual(["invalidUrl"]);
    expect(issues(url, {}, "http://localhost")).toEqual(["invalidUrl"]);
  });

  it("phone wants an international number and normalizes input", () => {
    expect(issues(phone, {}, "+989121234567")).toEqual([]);
    expect(issues(phone, {}, "09121234567")).toEqual(["invalidPhone"]);
    expect(normalizePhone("۰۹۱۲ ۱۲۳ ۴۵۶۷", "98")).toBe("+989121234567");
    expect(normalizePhone("0044 (20) 7946-0958")).toBe("+442079460958");
    expect(normalizePhone("+1 +2")).toBe("+12");
    expect(() => phone.settings.parse({ defaultCountry: "+98" })).toThrow();
  });

  it("time and date-time check format and bounds", () => {
    expect(issues(time, { min: "09:00", max: "17:30" }, "08:59")).toEqual(["tooEarly"]);
    expect(issues(time, { max: "17:30" }, "17:31")).toEqual(["tooLate"]);
    expect(issues(time, {}, "24:00")).toEqual(["invalidTime"]);
    expect(issues(time, {}, "09:05")).toEqual([]);
    expect(issues(dateTime, { min: "2026-10-19T09:00" }, "2026-10-19T08:00")).toEqual(["tooEarly"]);
    expect(issues(dateTime, {}, "2026-13-01T10:00")).toEqual(["invalidDate"]);
  });

  it("rating, NPS and slider check their scales", () => {
    expect(issues(rating, {}, 6)).toEqual(["tooBig"]);
    expect(issues(rating, { max: 10 }, 10)).toEqual([]);
    expect(issues(rating, {}, 0)).toEqual(["tooSmall"]);
    expect(() => rating.settings.parse({ max: 20 })).toThrow();
    expect(issues(nps, {}, 0)).toEqual([]);
    expect(issues(nps, {}, 11)).toEqual(["tooBig"]);
    expect(issues(nps, {}, 7.5)).toEqual(["notInteger"]);
    expect(issues(slider, { min: 0, max: 1, step: 0.1 }, 0.3)).toEqual([]);
    expect(issues(slider, { min: 0, max: 100, step: 5 }, 12)).toEqual(["invalidStep"]);
    expect(issues(slider, { min: 0, max: 100 }, 101)).toEqual(["tooBig"]);
  });

  it("hidden keeps short strings", () => {
    expect(issues(hidden, { fromUrl: "utm_source" }, "newsletter")).toEqual([]);
    expect(issues(hidden, {}, "x".repeat(1001))).toEqual(["tooLong"]);
    expect(() => hidden.settings.parse({ fromUrl: "a b" })).toThrow();
  });
});
