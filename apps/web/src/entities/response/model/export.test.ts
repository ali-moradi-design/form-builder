import type { FormDocument } from "@formweave/schema";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { responseColumns } from "./columns";
import { safeCell, toCsv, toJson, toTable, toXlsx } from "./export";

const doc: FormDocument = {
  schemaVersion: 1,
  id: "f",
  title: "F",
  locales: { default: "fa" },
  steps: [
    {
      key: "a",
      fields: [
        { type: "shortText", key: "name", label: "نام" },
        { type: "number", key: "age", label: "Age" },
        { type: "switch", key: "ok", label: "OK" },
      ],
    },
  ],
};
const rows = [
  {
    id: "1",
    version: 2,
    locale: "fa",
    createdAt: new Date("2026-10-19T10:00:00Z"),
    data: { name: "=SUM(A1)", age: 30, ok: true },
  },
];
const labels = {
  submitted: "Submitted",
  version: "Version",
  language: "Language",
  yes: "Yes",
  no: "No",
};

describe("export", () => {
  const table = toTable(responseColumns([doc], "fa"), rows, labels);

  it("builds a safe table", () => {
    expect(table).toEqual([
      ["Submitted", "Version", "Language", "نام", "Age", "OK"],
      ["2026-10-19T10:00:00.000Z", 2, "fa", "'=SUM(A1)", 30, "Yes"],
    ]);
    expect(safeCell("-1")).toBe("'-1");
    expect(safeCell(-1)).toBe(-1);
  });

  it("writes CSV with a BOM", () => {
    const csv = toCsv(table);
    expect(csv.startsWith("﻿Submitted,Version")).toBe(true);
    expect(csv).toContain("'=SUM(A1)");
  });

  it("writes an Excel file that reads back", async () => {
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(await toXlsx(table, "Poll: v2"));
    const sheet = book.worksheets[0];
    expect(sheet?.name).toBe("Poll  v2");
    expect(sheet?.getRow(2).getCell(5).value).toBe(30);
    expect(sheet?.getRow(1).getCell(4).value).toBe("نام");
  });

  it("writes raw JSON", () => {
    expect(JSON.parse(toJson(rows))).toEqual([
      {
        id: "1",
        version: 2,
        locale: "fa",
        submittedAt: "2026-10-19T10:00:00.000Z",
        data: { name: "=SUM(A1)", age: 30, ok: true },
      },
    ]);
  });
});
