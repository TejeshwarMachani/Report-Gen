import { Doc } from "./_generated/dataModel";
import { ColumnType } from "./schema";

export type DatasetDoc = Doc<"datasets">;
export type Col = DatasetDoc["columns"][number];

// ---------- type coercion ----------

export function coerce(type: ColumnType, raw: unknown): unknown {
  if (raw === null || raw === undefined || raw === "") return null;
  switch (type) {
    case "number": {
      if (typeof raw === "number") return raw;
      const s = String(raw).trim().replace(/[$,%€£\s]/g, "");
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    case "date": {
      const d = new Date(String(raw));
      return isNaN(d.getTime()) ? null : d.getTime();
    }
    case "category":
    case "text":
      return String(raw);
  }
}

// ---------- numeric helpers ----------

export function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

export function mean(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : 0;
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1));
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function percentile(xs: number[], p: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (idx - lo) * (s[hi] - s[lo]);
}

// ---------- linear regression / trend ----------

export interface TrendResult {
  slope: number;
  intercept: number;
  r2: number;
  direction: "up" | "down" | "flat";
  pctChangeFirstToLast: number | null;
}

export function linearTrend(xs: number[], ys: number[]): TrendResult {
  const n = xs.length;
  if (n < 2) {
    return {
      slope: 0,
      intercept: ys[0] ?? 0,
      r2: 0,
      direction: "flat",
      pctChangeFirstToLast: null,
    };
  }
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i] + intercept;
    ssTot += (ys[i] - my) ** 2;
    ssRes += (ys[i] - pred) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const direction: "up" | "down" | "flat" =
    slope > 0 ? "up" : slope < 0 ? "down" : "flat";
  const first = ys[0];
  const last = ys[ys.length - 1];
  const pctChangeFirstToLast =
    first !== 0 ? ((last - first) / Math.abs(first)) * 100 : null;
  return { slope, intercept, r2, direction, pctChangeFirstToLast };
}

// ---------- outliers ----------

export function detectOutliersIQR(
  xs: number[],
): { indices: number[]; lower: number; upper: number } {
  const q1 = percentile(xs, 0.25);
  const q3 = percentile(xs, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const indices: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] < lower || xs[i] > upper) indices.push(i);
  }
  return { indices, lower, upper };
}

// ---------- formatting ----------

export function fmtDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export function fmtNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Human-readable rendering of a computed result (used for fallback answers). */
export function formatResult(result: unknown): string {
  if (result === null || result === undefined) return "no result";
  if (typeof result === "object") {
    const obj = result as Record<string, unknown>;
    if (typeof obj.label === "string" && (typeof obj.value === "number" || obj.value === null)) {
      return `${obj.label} = ${obj.value === null ? "no valid values" : fmtNumber(obj.value as number)}`;
    }
    if (Array.isArray(result)) {
      const arr = result as Array<{ label: string; value: number }>;
      if (arr.length && typeof arr[0]?.label === "string" && typeof arr[0]?.value === "number") {
        return arr.map((p) => `${p.label}: ${fmtNumber(p.value)}`).join(", ");
      }
    }
    if (obj.series && obj.trend) {
      const trend = obj.trend as { direction: string; pctChange: number | null };
      const pctText = trend.pctChange != null ? ` (${trend.pctChange > 0 ? "+" : ""}${trend.pctChange.toFixed(1)}% first-to-last)` : "";
      return `monthly trend is ${trend.direction}${pctText}`;
    }
    return JSON.stringify(result);
  }
  return String(result);
}

// ---------- group-by series ----------

export interface SeriesPoint {
  label: string;
  value: number;
}

export function groupBySum(
  rows: unknown[][],
  groupColIdx: number,
  valueColIdx: number | null,
): SeriesPoint[] {
  const groups = new Map<string, number>();
  for (const row of rows) {
    const key = row[groupColIdx];
    if (key === null || key === undefined) continue;
    const label = String(key);
    const val = valueColIdx === null ? 1 : ((row[valueColIdx] as number) ?? 0);
    groups.set(label, (groups.get(label) ?? 0) + val);
  }
  return [...groups.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Aggregate a metric into monthly buckets keyed by a date column. */
export function monthlyBuckets(
  rows: unknown[][],
  dateIdx: number,
  valueIdx: number | null,
): { label: string; sortKey: string; value: number }[] {
  const buckets = new Map<string, number>();
  for (const row of rows) {
    const t = row[dateIdx];
    if (typeof t !== "number" || !Number.isFinite(t)) continue;
    const d = new Date(t);
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const val = valueIdx === null ? 1 : ((row[valueIdx] as number) ?? 0);
    buckets.set(sortKey, (buckets.get(sortKey) ?? 0) + val);
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([sortKey, value]) => {
      const [y, m] = sortKey.split("-").map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      return { label, sortKey, value };
    });
}

// ---------- fact packs for the LLM ----------

export interface ReportFacts {
  datasetName: string;
  rowCount: number;
  columnCount: number;
  columns: Array<{ name: string; type: string; missingPct: number }>;
  metrics: Array<{
    column: string;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    stdev: number;
    count: number;
  }>;
  dateSpan?: { column: string; start: string; end: string };
  trends: Array<{
    column: string;
    direction: "up" | "down" | "flat";
    pctChange: number | null;
    r2: string;
  }>;
  topCategories: Array<{ column: string; top: Array<{ label: string; value: number }> }>;
  outliers: Array<{ column: string; count: number; min: number; max: number }>;
  dataQuality: string[];
}

export function buildReportFacts(dataset: DatasetDoc, rows: unknown[][]): ReportFacts {
  const cols = dataset.columns as Col[];
  const numCols = cols.filter((c) => c.type === "number");
  const dateCols = cols.filter((c) => c.type === "date");
  const catCols = cols.filter((c) => c.type === "category" && c.uniqueCount <= 30);

  const numericValues = (c: Col): number[] =>
    rows
      .map((r) => r[cols.indexOf(c)])
      .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  const metrics = numCols.slice(0, 6).map((c) => {
    const xs = numericValues(c);
    return {
      column: c.name,
      sum: sum(xs),
      mean: mean(xs),
      median: median(xs),
      min: xs.length ? Math.min(...xs) : 0,
      max: xs.length ? Math.max(...xs) : 0,
      stdev: stdev(xs),
      count: xs.length,
    };
  });

  const dateCol = dateCols[0];
  let dateSpan: ReportFacts["dateSpan"];
  if (dateCol) {
    const ts = rows.map((r) => r[cols.indexOf(dateCol)]).filter(
      (t): t is number => typeof t === "number" && Number.isFinite(t),
    );
    if (ts.length > 1) {
      dateSpan = {
        column: dateCol.name,
        start: fmtDate(Math.min(...ts)),
        end: fmtDate(Math.max(...ts)),
      };
    }
  }

  const trends: ReportFacts["trends"] = [];
  if (dateCol) {
    const dIdx = cols.indexOf(dateCol);
    for (const c of numCols.slice(0, 4)) {
      const pairs = rows
        .map((r) => ({ t: r[dIdx], y: r[cols.indexOf(c)] }))
        .filter(
          (p): p is { t: number; y: number } =>
            typeof p.t === "number" && Number.isFinite(p.t) && typeof p.y === "number" && Number.isFinite(p.y),
        );
      const buckets = monthlyBuckets(pairs.map((p) => [p.t, p.y]), 0, 1);
      if (buckets.length >= 2) {
        const tr = linearTrend(
          buckets.map((_, i) => i),
          buckets.map((b) => b.value),
        );
        trends.push({
          column: c.name,
          direction: tr.direction,
          pctChange: tr.pctChangeFirstToLast,
          r2: tr.r2.toFixed(2),
        });
      }
    }
  }

  const topCategories = catCols.slice(0, 4).map((c) => {
    const measureIdx = numCols.length ? cols.indexOf(numCols[0]) : null;
    const series = groupBySum(rows, cols.indexOf(c), measureIdx);
    return { column: c.name, top: series.slice(0, 5) };
  });

  const outliers = numCols.slice(0, 3).map((c) => {
    const xs = numericValues(c);
    const { indices } = detectOutliersIQR(xs);
    const values = indices.map((i) => xs[i]);
    return {
      column: c.name,
      count: indices.length,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    };
  });

  const dataQuality: string[] = [];
  for (const c of cols) {
    const missingPct = dataset.rowCount ? (c.missingCount / dataset.rowCount) * 100 : 0;
    if (missingPct > 5) {
      dataQuality.push(`${c.name} is missing ${missingPct.toFixed(0)}% of values`);
    }
    if (c.type === "text" && dataset.rowCount > 20 && c.uniqueCount > dataset.rowCount * 0.9) {
      dataQuality.push(`${c.name} is nearly unique per row (possible ID column)`);
    }
  }

  return {
    datasetName: dataset.name,
    rowCount: dataset.rowCount,
    columnCount: cols.length,
    columns: cols.map((c) => ({
      name: c.name,
      type: c.type,
      missingPct: dataset.rowCount
        ? +((c.missingCount / dataset.rowCount) * 100).toFixed(1)
        : 0,
    })),
    metrics,
    dateSpan,
    trends,
    topCategories,
    outliers,
    dataQuality,
  };
}

// ---------- chat: deterministic question answering ----------

export interface ChatComputation {
  kind: string;
  description: string;
  result?: unknown;
  chart?: { chartType: "bar" | "line" | "pie"; title: string; data: SeriesPoint[] };
}

interface ParsedQuestion {
  op: "sum" | "avg" | "min" | "max" | "count" | "groupby" | "trend";
  metricCol?: string;
  groupCol?: string;
  limit?: number;
}

function parseQuestion(question: string, cols: Col[]): ParsedQuestion | null {
  const q = question.toLowerCase();
  const mentionedCols = cols.filter((c) => q.includes(c.name.toLowerCase()));

  // Trend: "trend of revenue over time", "monthly sales"
  if (/\bover time\b|\btrend\b|\bmonthly\b|\bby month\b/.test(q)) {
    const metricCol = mentionedCols.find((c) => c.type === "number")?.name;
    if (metricCol) return { op: "trend", metricCol };
  }

  // Group-by: "revenue by region", "top 5 products by sales"
  const byMatch = q.match(/\b(?:by|per)\s+([a-z0-9_ \-']+)/);
  if (byMatch) {
    const rest = byMatch[1].trim();
    const groupCol = mentionedCols.find((c) => rest.includes(c.name.toLowerCase()) && c.type !== "number");
    const metricCol = mentionedCols.find((c) => c.type === "number")?.name;
    if (groupCol && metricCol) {
      const limitMatch = q.match(/\btop\s+(\d+)\b/);
      return { op: "groupby", metricCol, groupCol: groupCol.name, limit: limitMatch ? +limitMatch[1] : 8 };
    }
  }

  const metricCol = mentionedCols.find((c) => c.type === "number")?.name;
  if (/\b(total|sum)\b/.test(q) && metricCol) return { op: "sum", metricCol };
  if (/\b(average|mean|avg)\b/.test(q) && metricCol) return { op: "avg", metricCol };
  if (/\b(max|maximum|highest|largest|best)\b/.test(q) && metricCol) return { op: "max", metricCol };
  if (/\b(min|minimum|lowest|smallest)\b/.test(q) && metricCol) return { op: "min", metricCol };
  if (/\b(how many|count|number of)\b/.test(q)) return { op: "count" };
  if (metricCol) return { op: "sum", metricCol };

  return null;
}

/**
 * Deterministically compute an answer for a question. The LLM later phrases
 * `result` into a sentence; it never sees raw rows and never does arithmetic.
 */
export function computeAnswer(dataset: DatasetDoc, question: string): ChatComputation {
  const cols = dataset.columns as Col[];
  const rows: unknown[][] = dataset.rows.map((row) =>
    cols.map((c, i) => coerce(c.type, row[i])),
  );
  const parsed = parseQuestion(question, cols);

  if (!parsed) {
    const sampleCols = cols.slice(0, 8).map((c) => `${c.name} (${c.type})`);
    return {
      kind: "unsupported",
      description: `No matching aggregation. Available columns: ${sampleCols.join(", ")}`,
    };
  }

  const idx = (name: string) => cols.findIndex((c) => c.name === name);
  const finite = (xs: unknown[]) => xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x));

  switch (parsed.op) {
    case "count":
      return {
        kind: "count",
        description: "COUNT(*) over all rows",
        result: { label: "Row count", value: dataset.rowCount },
      };

    case "sum":
    case "avg":
    case "min":
    case "max": {
      const mIdx = idx(parsed.metricCol!);
      if (mIdx < 0) break;
      const xs = finite(rows.map((r) => r[mIdx]));
      if (!xs.length) {
        return {
          kind: "aggregate",
          description: `${parsed.op.toUpperCase()}(${parsed.metricCol}) — no valid numeric values`,
          result: { label: `${parsed.op.toUpperCase()}(${parsed.metricCol})`, value: null },
        };
      }
      const val =
        parsed.op === "sum"
          ? sum(xs)
          : parsed.op === "avg"
            ? mean(xs)
            : parsed.op === "min"
              ? Math.min(...xs)
              : Math.max(...xs);
      const label = `${parsed.op.toUpperCase()}(${parsed.metricCol})`;
      return {
        kind: "aggregate",
        description: `${label} computed over ${xs.length} valid numeric values`,
        result: { label, value: val },
      };
    }

    case "groupby": {
      const gIdx = idx(parsed.groupCol!);
      const mIdx = idx(parsed.metricCol!);
      if (gIdx < 0) break;
      const series = groupBySum(rows, gIdx, mIdx >= 0 ? mIdx : null).slice(
        0,
        parsed.limit ?? 8,
      );
      const chartType: "bar" | "line" | "pie" = cols[gIdx].type === "date" ? "line" : "bar";
      return {
        kind: "group-by",
        description: `SUM(${parsed.metricCol ?? "row count"}) GROUP BY ${parsed.groupCol}, top ${series.length} groups`,
        result: series,
        chart: {
          chartType,
          title: `${parsed.metricCol ?? "Rows"} by ${parsed.groupCol}`,
          data: series,
        },
      };
    }

    case "trend": {
      const mIdx = idx(parsed.metricCol!);
      const dateCol = cols.find((c) => c.type === "date");
      if (mIdx < 0 || !dateCol) break;
      const buckets = monthlyBuckets(rows, cols.indexOf(dateCol), mIdx);
      if (buckets.length < 2) {
        return {
          kind: "trend",
          description: `Not enough date-valid rows to compute a monthly trend for ${parsed.metricCol}`,
          result: { series: [], trend: { direction: "flat", pctChange: null } },
        };
      }
      const series: SeriesPoint[] = buckets.map((b) => ({ label: b.label, value: b.value }));
      const tr = linearTrend(
        series.map((_, i) => i),
        series.map((s) => s.value),
      );
      return {
        kind: "trend",
        description: `SUM(${parsed.metricCol}) per month from ${dateCol.name}, ${series.length} months`,
        result: {
          series,
          trend: { direction: tr.direction, pctChange: tr.pctChangeFirstToLast },
        },
        chart: { chartType: "line", title: `${parsed.metricCol} over time`, data: series },
      };
    }
  }

  return {
    kind: "unsupported",
    description: "Question could not be mapped to a safe aggregation",
  };
}
