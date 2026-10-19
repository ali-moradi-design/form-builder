import Papa from "papaparse";
import type { ResponseRow } from "@/shared/db";
import { formatAnswer, type ResponseColumn } from "./columns";

/** File formats responses can be exported to. */
export const EXPORT_FORMATS = ["csv", "xlsx", "json"] as const;

/** One of {@link EXPORT_FORMATS}. */
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** Header words in the reader's language. */
export interface ExportLabels {
  readonly submitted: string;
  readonly version: string;
  readonly language: string;
  readonly yes: string;
  readonly no: string;
}

/** A cell: text, or a number kept as a number for spreadsheets. */
export type Cell = string | number;

// Spreadsheet apps run cells that start with these as formulas.
const FORMULA = /^[=+\-@\t\r]/;

/** Makes text safe to open in a spreadsheet (no formula injection). */
export function safeCell(value: Cell): Cell {
  return typeof value === "string" && FORMULA.test(value) ? `'${value}` : value;
}

/** Header row plus one row per response, answers as readable text. */
export function toTable(
  columns: readonly ResponseColumn[],
  rows: readonly ResponseRow[],
  labels: ExportLabels,
): Cell[][] {
  const header: Cell[] = [
    labels.submitted,
    labels.version,
    labels.language,
    ...columns.map((c) => c.label),
  ];
  const body = rows.map((r): Cell[] => [
    r.createdAt.toISOString(),
    r.version,
    r.locale ?? "",
    ...columns.map((c) => {
      const value = r.data[c.key];
      return typeof value === "number" ? value : formatAnswer(c, value, [labels.yes, labels.no]);
    }),
  ]);
  return [header, ...body].map((row) => row.map(safeCell));
}

/** CSV with a byte order mark, so Excel reads Persian and other non-Latin text. */
export function toCsv(table: readonly Cell[][]): string {
  return `\uFEFF${Papa.unparse(table as Cell[][], { newline: "\r\n" })}`;
}

/** An Excel workbook with one sheet. */
export async function toXlsx(table: readonly Cell[][], sheetName: string): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet(
    sheetName.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Responses",
    {
      views: [{ state: "frozen", ySplit: 1 }],
    },
  );
  sheet.addRows(table as Cell[][]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => {
    column.width = 22;
  });
  return book.xlsx.writeBuffer();
}

/** Raw answers as JSON (values as stored, not formatted). */
export function toJson(rows: readonly ResponseRow[]): string {
  return JSON.stringify(
    rows.map((r) => ({
      id: r.id,
      version: r.version,
      locale: r.locale,
      submittedAt: r.createdAt.toISOString(),
      data: r.data,
    })),
    null,
    2,
  );
}
