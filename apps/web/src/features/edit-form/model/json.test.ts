import { describe, expect, it } from "vitest";
import { formatPath, readJson, toJson } from "./json";

const doc = {
  schemaVersion: 1,
  id: "f",
  title: "Form",
  locales: { default: "en" },
  steps: [{ key: "a", fields: [{ type: "shortText", key: "x" }] }],
} as const;

describe("JSON editor", () => {
  it("round-trips a document", () => {
    expect(readJson(toJson(doc))).toEqual({ kind: "ok", doc });
  });

  it("reports syntax errors and invalid documents", () => {
    expect(readJson("{").kind).toBe("syntax");
    const bad = readJson(
      JSON.stringify({
        ...doc,
        steps: [
          { key: "a", fields: [{ type: "shortText", key: "x", visibleWhen: { var: "nope" } }] },
        ],
      }),
    );
    expect(bad.kind).toBe("invalid");
    if (bad.kind === "invalid") expect(bad.issues[0]?.message).toContain("nope");
  });

  it("formats issue paths", () => {
    expect(formatPath(["steps", 0, "fields", 2, "key"])).toBe("steps[0].fields[2].key");
  });
});
