import { describe, expect, it } from "vitest";
import { formatNumber, isRtl, localizeDigits, normalizeDigits, resolveText } from "./i18n.js";
import { en, fa, formatIssue } from "./messages.js";

describe("i18n", () => {
  it("resolves localized text with fallbacks", () => {
    const t = { en: "Name", fa: "نام" };
    expect(resolveText(t, "fa-IR", "en")).toBe("نام");
    expect(resolveText(t, "de", "en")).toBe("Name");
    expect(resolveText("Plain", "fa")).toBe("Plain");
    expect(resolveText(undefined, "en")).toBe("");
  });

  it("knows writing direction", () => {
    expect(isRtl("fa")).toBe(true);
    expect(isRtl("en-US")).toBe(false);
  });

  it("formats and converts digits", () => {
    // The group separator comes from the platform's locale data.
    expect(formatNumber(1284, "fa")).toMatch(/^۱.۲۸۴$/);
    expect(formatNumber(1284, "fa", "latin")).toMatch(/^1.284$/);
    expect(localizeDigits("v3, 2026", "fa")).toBe("v۳, ۲۰۲۶");
    expect(normalizeDigits("۱۲٣")).toBe("123");
  });

  it("formats issues in both languages", () => {
    const issue = { key: "name", code: "tooShort", params: { min: 2 } };
    expect(formatIssue(issue, en, "en")).toBe("Use at least 2 characters.");
    expect(formatIssue(issue, fa, "fa")).toBe("دست‌کم ۲ نویسه بنویسید.");
    expect(formatIssue({ key: "x", code: "unknownCode" }, en, "en")).toBe(en.invalid);
  });

  it("has a Persian message for every English one", () => {
    expect(Object.keys(fa).sort()).toEqual(Object.keys(en).sort());
  });
});
