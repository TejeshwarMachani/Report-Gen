/**
 * Targeted tests for the deterministic analytics engine
 * (src/convex/analytics.ts) — the module that guarantees ReportGen
 * never invents numbers. Run with: bun test tests/analytics.test.ts
 */
import { describe, expect, it } from "bun:test";
import {
  buildDeterministicNarrative,
  coerce,
  computeAnswer,
  detectOutliersIQR,
  fmtDate,
  formatResult,
  groupBySum,
  linearTrend,
  mean,
  median,
  monthlyBuckets,
  percentile,
  stdev,
  sum,
} from "../src/convex/analytics";
import type { DatasetDoc, ReportFacts } from "../src/convex/analytics";

// ---------------------------------------------------------------------------
// Type coercion
// ---------------------------------------------------------------------------

describe("coerce", () => {
  it("parses currency/percent-formatted numbers", () => {
    expect(coerce("number", "$1,200")).toBe(1200);
    expect(coerce("number", "45%")).toBe(45);
    expect(coerce("number", "€99.5")).toBe(99.5);
    expect(coerce("number", 42)).toBe(42);
  });

  it("returns null for empty or unparseable numbers", () => {
    expect(coerce("number", "")).toBeNull();
    expect(coerce("number", null)).toBeNull();
    expect(coerce("number", "N/A")).toBeNull();
  });

  it("parses dates to epoch ms and rejects garbage", () => {
    expect(coerce("date", "2024-01-15")).toBe(new Date("2024-01-15").getTime());
    expect(coerce("date", "not a date")).toBeNull();
  });

  it("stringifies categories and text", () => {
    expect(coerce("category", "East")).toBe("East");
    expect(coerce("text", 123)).toBe("123");
  });
});

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

describe("numeric helpers", () => {
  it("sum / mean handle empty arrays", () => {
    expect(sum([])).toBe(0);
    expect(mean([])).toBe(0);
  });

  it("median splits even/odd lengths", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  it("stdev is sample stdev", () => {
    expect(stdev([2, 4])).toBeCloseTo(1.4142, 4);
    expect(stdev([7])).toBe(0);
  });

  it("percentile interpolates", () => {
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(percentile([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75, 6);
  });
});

// ---------------------------------------------------------------------------
// Linear trend
// ---------------------------------------------------------------------------

describe("linearTrend", () => {
  it("fits a perfect line with r2 = 1 and direction up", () => {
    const t = linearTrend([0, 1, 2, 3], [100, 200, 300, 400]);
    expect(t.r2).toBeCloseTo(1, 6);
    expect(t.slope).toBeCloseTo(100, 6);
    expect(t.direction).toBe("up");
    expect(t.pctChangeFirstToLast).toBeCloseTo(300, 6);
  });

  it("detects a downward trend", () => {
    const t = linearTrend([0, 1, 2], [90, 60, 30]);
    expect(t.direction).toBe("down");
    expect(t.pctChangeFirstToLast).toBeCloseTo(-66.6667, 3);
  });

  it("is flat with fewer than 2 points", () => {
    const t = linearTrend([0], [42]);
    expect(t.direction).toBe("flat");
    expect(t.slope).toBe(0);
    expect(t.pctChangeFirstToLast).toBeNull();
  });

  it("handles constant series (zero variance in x and y)", () => {
    const t = linearTrend([5, 5, 5], [10, 10, 10]);
    expect(t.slope).toBe(0);
    expect(t.direction).toBe("flat");
    expect(t.r2).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Outliers
// ---------------------------------------------------------------------------

describe("detectOutliersIQR", () => {
  it("flags the extreme value only", () => {
    const xs = [10, 11, 12, 13, 14, 15, 100];
    const { indices, lower, upper } = detectOutliersIQR(xs);
    expect(indices).toEqual([6]);
    expect(upper).toBeLessThan(100);
    expect(lower).toBeLessThan(10);
  });

  it("flags nothing in a tight uniform series", () => {
    const { indices } = detectOutliersIQR([1, 2, 3, 4, 5]);
    expect(indices).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Group-by & monthly buckets
// ---------------------------------------------------------------------------

describe("groupBySum", () => {
  const rows: unknown[][] = [
    ["East", 100],
    ["West", 50],
    ["East", 200],
    [null, 999],
  ];

  it("sums per group, skips null keys, sorts descending", () => {
    expect(groupBySum(rows, 0, 1)).toEqual([
      { label: "East", value: 300 },
      { label: "West", value: 50 },
    ]);
  });

  it("counts rows when no value column is given", () => {
    expect(groupBySum(rows, 0, null)).toEqual([
      { label: "East", value: 2 },
      { label: "West", value: 1 },
    ]);
  });
});

describe("monthlyBuckets", () => {
  const rows: unknown[][] = [
    [new Date("2024-01-15").getTime(), 100],
    [new Date("2024-02-01").getTime(), 50],
    [new Date("2024-01-20").getTime(), 200],
    ["garbage", 10], // non-date rows are skipped
  ];

  it("buckets by year-month in chronological order", () => {
    const buckets = monthlyBuckets(rows, 0, 1);
    expect(buckets.map((b) => b.value)).toEqual([300, 50]);
    expect(buckets[0].sortKey).toBe("2024-01");
    expect(buckets[0].label).toMatch(/Jan/);
  });
});

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

describe("formatResult", () => {
  it("renders label/value pairs", () => {
    expect(formatResult({ label: "Row count", value: 42 })).toBe("Row count = 42");
    expect(formatResult({ label: "Sum", value: null })).toBe("Sum = no valid values");
  });

  it("renders series arrays", () => {
    expect(formatResult([{ label: "East", value: 300 }])).toBe("East: 300");
  });

  it("renders trend summaries and nulls", () => {
    expect(formatResult({ series: [], trend: { direction: "up", pctChange: 12.34 } })).toContain(
      "monthly trend is up (+12.3% first-to-last)",
    );
    expect(formatResult(null)).toBe("no result");
  });
});

describe("fmtDate", () => {
  it("formats epoch ms as 'Mon YYYY'", () => {
    expect(fmtDate(new Date("2024-03-01").getTime())).toMatch(/Mar.*2024/);
  });
});

// ---------------------------------------------------------------------------
// Chat: deterministic question answering (the trust-critical path)
// ---------------------------------------------------------------------------

const mockDataset = {
  name: "sales-export",
  rowCount: 5,
  columns: [
    { name: "Date", type: "date", missingCount: 0, uniqueCount: 5, sample: [] },
    { name: "Region", type: "category", missingCount: 0, uniqueCount: 2, sample: [] },
    { name: "Revenue", type: "number", missingCount: 1, uniqueCount: 4, sample: [] },
  ],
  rows: [
    ["2024-01-15", "East", "$1,000"],
    ["2024-01-20", "West", "2000"],
    ["2024-02-10", "East", "$500"],
    ["2024-02-15", "West", ""],
    ["2024-03-05", "East", "$1,500"],
  ],
} as unknown as DatasetDoc;

describe("computeAnswer", () => {
  it("answers totals from real rows (sums coerced values, skips missing)", () => {
    const r = computeAnswer(mockDataset, "what is the total revenue?");
    expect(r.kind).toBe("aggregate");
    expect(r.description).toContain("SUM(Revenue)");
    expect((r.result as { value: number }).value).toBe(5000);
  });

  it("answers averages", () => {
    const r = computeAnswer(mockDataset, "average revenue");
    expect((r.result as { value: number }).value).toBe(1250);
  });

  it("counts rows", () => {
    const r = computeAnswer(mockDataset, "how many rows do we have?");
    expect(r.kind).toBe("count");
    expect((r.result as { value: number }).value).toBe(5);
  });

  it("groups by a category column with a bar chart, sorted desc", () => {
    const r = computeAnswer(mockDataset, "revenue by region");
    expect(r.kind).toBe("group-by");
    expect(r.result).toEqual([
      { label: "East", value: 3000 },
      { label: "West", value: 2000 },
    ]);
    expect(r.chart?.chartType).toBe("bar");
    expect(r.chart?.title).toBe("Revenue by Region");
  });

  it("computes monthly trends with a line chart", () => {
    const r = computeAnswer(mockDataset, "revenue trend over time");
    expect(r.kind).toBe("trend");
    expect(r.chart?.chartType).toBe("line");
    expect((r.result as { series: unknown[] }).series).toHaveLength(3);
    const trend = (r.result as { trend: { direction: string; pctChange: number } }).trend;
    expect(trend.direction).toBe("down"); // 3000 → 500 → 1500
    expect(trend.pctChange).toBeCloseTo(-50, 6);
  });

  it("returns a safe unsupported response for unmappable questions", () => {
    const r = computeAnswer(mockDataset, "what is the meaning of life?");
    expect(r.kind).toBe("unsupported");
    expect(r.description).toContain("Available columns");
  });
});

// ---------------------------------------------------------------------------
// Deterministic narrative — the report fallback used when the AI gateway is
// unavailable. It must produce a complete report from computed stats alone.
// ---------------------------------------------------------------------------

const mockFacts: ReportFacts = {
  datasetName: "Q3 Sales",
  rowCount: 120,
  columnCount: 4,
  columns: [
    { name: "Revenue", type: "number", missingPct: 0 },
    { name: "Region", type: "category", missingPct: 1.5 },
  ],
  metrics: [
    {
      column: "Revenue",
      sum: 50000,
      mean: 500,
      median: 480,
      min: 100,
      max: 900,
      stdev: 120,
      count: 100,
    },
  ],
  dateSpan: { column: "Date", start: "Jan 2024", end: "Dec 2024" },
  trends: [
    { column: "Revenue", direction: "down", pctChange: -12.5, r2: "0.82" },
    { column: "Units", direction: "up", pctChange: 8, r2: "0.40" },
  ],
  topCategories: [
    {
      column: "Region",
      top: [
        { label: "East", value: 30000 },
        { label: "West", value: 20000 },
      ],
    },
  ],
  outliers: [{ column: "Revenue", count: 2, min: 850, max: 900 }],
  dataQuality: ["Region is missing 2% of values"],
};

describe("buildDeterministicNarrative", () => {
  it("fills every narrative section with no AI involved", () => {
    const n = buildDeterministicNarrative(mockFacts, "Sales performance overview");
    expect(n.headline.length).toBeGreaterThan(0);
    expect(n.summary.length).toBeGreaterThan(0);
    expect(n.watch.length).toBeGreaterThan(0);
    expect(n.insights.length).toBeGreaterThan(0);
  });

  it("cites the computed totals and date span verbatim", () => {
    const n = buildDeterministicNarrative(mockFacts, "Monthly summary");
    expect(n.headline).toContain("Q3 Sales");
    expect(n.headline).toContain("50,000");
    expect(n.summary).toContain("120 rows");
    expect(n.summary).toContain("Jan 2024");
  });

  it("flags the declining measure in what-to-watch", () => {
    const n = buildDeterministicNarrative(mockFacts, "Operations snapshot");
    expect(n.watch).toContain("Revenue");
    expect(n.watch).toContain("12.5%");
  });

  it("reports the leading category with its share of the total", () => {
    const n = buildDeterministicNarrative(mockFacts, "Sales performance overview");
    expect(n.insights.join(" ")).toContain("East");
    expect(n.insights.join(" ")).toContain("60%"); // 30000 of 50000
  });

  it("caps insights at five non-empty lines", () => {
    const n = buildDeterministicNarrative(mockFacts, "Sales performance overview");
    expect(n.insights).toHaveLength(5);
    for (const line of n.insights) expect(line.trim().length).toBeGreaterThan(0);
  });

  it("still produces a report when there are no numeric metrics", () => {
    const bare: ReportFacts = {
      ...mockFacts,
      metrics: [],
      trends: [],
      topCategories: [],
      outliers: [],
      dataQuality: [],
      dateSpan: undefined,
    };
    const n = buildDeterministicNarrative(bare, "Monthly summary");
    expect(n.headline).toContain("120 rows");
    expect(n.watch.length).toBeGreaterThan(0);
    expect(n.insights).toHaveLength(0);
  });
});
