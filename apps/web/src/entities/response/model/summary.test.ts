import { describe, expect, it } from "vitest";
import type { ResponseColumn } from "./columns";
import { perDay, summarize } from "./summary";

const plan: ResponseColumn = {
  key: "plan",
  label: "Plan",
  type: "radio",
  options: new Map([
    ["free", "Free"],
    ["team", "Team"],
  ]),
};
const tags: ResponseColumn = {
  key: "tags",
  label: "Tags",
  type: "checkboxes",
  options: new Map([["a", "A"]]),
};
const seats: ResponseColumn = { key: "seats", label: "Seats", type: "number" };
const ok: ResponseColumn = { key: "ok", label: "OK", type: "switch" };
const note: ResponseColumn = { key: "note", label: "Note", type: "longText" };

const rows = [
  { plan: "team", tags: ["a", "x"], seats: 4, ok: true, note: "newest" },
  { plan: "team", tags: ["a"], seats: 2, ok: false },
  { plan: "gone", seats: 9, ok: true, note: "older" },
  {},
];

describe("summaries", () => {
  const [p, t, s, o, n] = summarize([plan, tags, seats, ok, note], rows);

  it("counts choices in form order, then old values", () => {
    expect(p).toMatchObject({
      kind: "choice",
      answered: 3,
      buckets: [
        { label: "Free", count: 0 },
        { label: "Team", count: 2 },
        { label: "gone", count: 1 },
      ],
    });
    expect(t).toMatchObject({
      multiple: true,
      answered: 2,
      buckets: [
        { label: "A", count: 2 },
        { label: "x", count: 1 },
      ],
    });
  });

  it("describes numbers", () => {
    expect(s).toMatchObject({ kind: "number", answered: 3, min: 2, max: 9, mean: 5, median: 4 });
    if (s?.kind === "number") {
      expect(s.histogram.map((b) => b.label)).toEqual(["2", "3", "4", "5", "6", "7", "8", "9"]);
      expect(s.histogram.reduce((a, b) => a + b.count, 0)).toBe(3);
    }
    const [wide] = summarize([seats], [{ seats: 1 }, { seats: 40 }]);
    if (wide?.kind === "number") expect(wide.histogram[0]?.label).toBe("1–5");
  });

  it("counts switches as yes and no, and keeps recent text", () => {
    expect(o).toMatchObject({
      kind: "choice",
      answered: 4,
      buckets: [
        { label: "Yes", count: 2 },
        { label: "No", count: 2 },
      ],
    });
    expect(n).toMatchObject({ kind: "text", answered: 2, latest: ["newest", "older"] });
  });

  it("counts responses per day", () => {
    const now = new Date("2026-10-19T12:00:00Z");
    const days = perDay(
      [new Date("2026-10-19T01:00:00Z"), new Date("2026-10-18T23:00:00Z"), new Date("2026-01-01")],
      3,
      now,
    );
    expect(days).toEqual([
      { label: "2026-10-17", count: 0 },
      { label: "2026-10-18", count: 1 },
      { label: "2026-10-19", count: 1 },
    ]);
  });
});
