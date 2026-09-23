"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { coerce, fmtNumber, linearTrend, monthlyBuckets } from "./analytics";
import type { Id } from "./_generated/dataModel";

/**
 * Deterministic forecasting: monthly buckets + linear trend + residual-based
 * confidence band. Computed entirely in code — no LLM involved.
 */
export const runForecast = action({
  args: {
    datasetId: v.id("datasets"),
    metricColumn: v.string(),
    dateColumn: v.string(),
    horizon: v.number(),
  },
  handler: async (ctx, { datasetId, metricColumn, dateColumn, horizon }) => {
    const dataset = await ctx.runQuery(api.datasets.get, { datasetId });
    if (!dataset) throw new Error("Dataset not found");
    const cols = dataset.columns;
    const dIdx = cols.findIndex((c) => c.name === dateColumn);
    const mIdx = cols.findIndex((c) => c.name === metricColumn);
    if (dIdx < 0 || mIdx < 0) throw new Error("Selected columns not found");

    const rows: unknown[][] = dataset.rows.map((row) =>
      cols.map((c, i) => coerce(c.type, row[i])),
    );
    const buckets = monthlyBuckets(rows, dIdx, mIdx);
    if (buckets.length < 3) {
      throw new Error(
        `Need at least 3 months of data in "${dateColumn}" to forecast "${metricColumn}" (found ${buckets.length}).`,
      );
    }

    const values = buckets.map((b) => b.value);
    const xs = values.map((_, i) => i);
    const tr = linearTrend(xs, values);
    const residuals = values.map((v, i) => v - (tr.slope * i + tr.intercept));
    const stdevRes = Math.sqrt(
      residuals.reduce((a, r) => a + r * r, 0) / Math.max(1, values.length - 2),
    );

    const points: {
      label: string;
      value: number;
      kind: "actual" | "forecast";
      lower?: number;
      upper?: number;
    }[] = buckets.map((b) => ({ label: b.label, value: b.value, kind: "actual" as const }));

    const lastDate = buckets[buckets.length - 1].sortKey; // "YYYY-MM"
    const [ly, lm] = lastDate.split("-").map(Number);
    const bandScale = 1.96 * stdevRes;
    for (let h = 1; h <= horizon; h++) {
      const date = new Date(ly, lm - 1 + h, 1);
      const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const value = tr.slope * (values.length - 1 + h) + tr.intercept;
      const spread = bandScale * Math.sqrt(1 + h / Math.max(1, values.length));
      points.push({
        label,
        value: Math.max(0, value),
        kind: "forecast",
        lower: Math.max(0, value - spread),
        upper: value + spread,
      });
    }

    const forecastSum = points
      .filter((p) => p.kind === "forecast")
      .reduce((a, p) => a + p.value, 0);
    const lastActual = values[values.length - 1];
    const nextMonthValue = points.find((p) => p.kind === "forecast")?.value ?? 0;
    const monthlyChange =
      lastActual !== 0 ? ((nextMonthValue - lastActual) / Math.abs(lastActual)) * 100 : null;
    const direction =
      tr.direction === "up" ? "grow" : tr.direction === "down" ? "decline" : "stay flat";

    const summary = `Based on ${values.length} months of history, ${metricColumn} is trending to ${direction}. The forecast projects roughly ${fmtNumber(nextMonthValue)} next month${monthlyChange != null ? ` (${monthlyChange > 0 ? "+" : ""}${monthlyChange.toFixed(1)}% vs the latest month)` : ""}, adding up to about ${fmtNumber(forecastSum)} across the next ${horizon} ${horizon === 1 ? "month" : "months"}. This is a linear trend projection from your own data, so treat it as a guide, not a guarantee.`;

    const forecastId: Id<"forecasts"> = await ctx.runMutation(api.forecasts.insert, {
      datasetId,
      metricColumn,
      dateColumn,
      horizon,
      points,
      summary,
    });
    return forecastId;
  },
});
