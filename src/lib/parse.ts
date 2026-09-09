import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ColumnType = "number" | "date" | "category" | "text";

export interface ParsedColumn {
  name: string;
  type: ColumnType;
  missingCount: number;
  uniqueCount: number;
  sample: string[];
}

export interface ParsedData {
  fileName: string;
  fileSize: number;
  columns: ParsedColumn[];
  rows: unknown[][];
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB MVP limit

export const MAX_FILE_LABEL = "25MB";

// Cap stored rows so Convex documents stay reasonable; stats run on these rows.
const MAX_ROWS = 5000;
export const ROW_CAP = MAX_ROWS;

const DATE_RE =
  /^\d{4}[-/]\d{1,2}([-/]\d{1,2})?([ T]\d{2}:\d{2}(:\d{2})?)?$|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/;

function parseNumberLike(s: string): number | null {
  const cleaned = s.trim().replace(/[$,%€£\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function looksLikeDate(s: string): boolean {
  const t = s.trim();
  if (!t || t.length < 6) return false;
  if (!DATE_RE.test(t)) return false;
  return !Number.isNaN(new Date(t).getTime());
}

/** Infer a column type from non-empty cell values. */
export function inferColumnType(values: unknown[]): ColumnType {
  const strs = values.filter((v) => v !== null && v !== undefined && v !== "").map((v) => String(v));
  if (!strs.length) return "text";

  let nums = 0;
  let dates = 0;
  for (const s of strs) {
    if (parseNumberLike(s) !== null) nums++;
    if (looksLikeDate(s)) dates++;
  }
  const n = strs.length;
  if (dates / n >= 0.8) return "date";
  if (nums / n >= 0.8) return "number";

  const unique = new Set(strs).size;
  if (unique <= Math.max(30, n * 0.2)) return "category";
  return "text";
}

export interface ParseFileResult {
  data?: ParsedData;
  error?: string;
  warning?: string;
}

export async function parseDataFile(file: File): Promise<ParseFileResult> {
  if (file.size > MAX_FILE_BYTES) {
    return { error: `File is larger than ${MAX_FILE_LABEL}. Please upload a smaller file.` };
  }

  const name = file.name.toLowerCase();
  let rawRows: Record<string, unknown>[];

  try {
    if (name.endsWith(".csv") || name.endsWith(".txt") || file.type === "text/csv") {
      const text = await file.text();
      const result = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h.trim(),
      });
      if (result.errors.length && !result.data.length) {
        return { error: "Could not parse the CSV file." };
      }
      rawRows = result.data;
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) return { error: "The workbook has no sheets." };
      rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
    } else {
      return { error: "Unsupported file type. Please upload a CSV or XLSX file." };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to read the file." };
  }

  if (!rawRows.length) {
    return { error: "The file has no data rows." };
  }

  // Union of headers in original-ish order
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const row of rawRows) {
    for (const key of Object.keys(row)) {
      const k = key.trim() || "column";
      if (!seen.has(k)) {
        seen.add(k);
        headers.push(k);
      }
    }
  }
  if (headers.length > 40) headers.length = 40;

  let warning: string | undefined;
  let dataRows = rawRows;
  if (dataRows.length > MAX_ROWS) {
    dataRows = dataRows.slice(0, MAX_ROWS);
    warning = `Only the first ${MAX_ROWS.toLocaleString()} rows were analyzed (file had ${rawRows.length.toLocaleString()}).`;
  }

  const rows: unknown[][] = dataRows.map((row) =>
    headers.map((h) => {
      const v = row[h];
      if (v === undefined) return null;
      if (v instanceof Date) return v.toISOString();
      return v as unknown;
    }),
  );

  const columns: ParsedColumn[] = headers.map((h, colIdx) => {
    const values = rows.map((r) => r[colIdx]);
    const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== "");
    const type = inferColumnType(nonEmpty);
    const unique = new Set(nonEmpty.map((v) => String(v))).size;
    const sample = nonEmpty.slice(0, 3).map((v) => String(v));
    return {
      name: h,
      type,
      missingCount: values.length - nonEmpty.length,
      uniqueCount: unique,
      sample,
    };
  });

  return {
    data: { fileName: file.name, fileSize: file.size, columns, rows },
    warning,
  };
}
