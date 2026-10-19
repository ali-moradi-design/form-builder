import { compile, createRegistry } from "@formweave/engine";
import { allFields } from "@formweave/engine/fields/all";
import { parseFormDocument } from "@formweave/schema/meta";
import { describe, expect, it } from "vitest";
import { chartTemplate, countInputs, findTemplate, jobTemplate, TEMPLATES } from "./gallery";

const registry = createRegistry(allFields);

describe("template gallery", () => {
  it.each(TEMPLATES.map((t) => [t.id, t] as const))("%s is a valid form", (id, t) => {
    expect(t.document.id).toBe(id);
    expect(parseFormDocument(t.document).success).toBe(true);
    expect(() => compile(t.document, { registry })).not.toThrow();
  });

  it("has unique ids and finds them", () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    expect(findTemplate("job-application")?.category).toBe("hiring");
    expect(findTemplate("nope")).toBeUndefined();
  });

  it("counts answerable fields inside groups and repeaters", () => {
    expect(countInputs(chartTemplate)).toBe(11);
    expect(countInputs(jobTemplate)).toBe(13);
  });
});
