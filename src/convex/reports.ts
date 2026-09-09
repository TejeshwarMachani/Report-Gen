import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireDatasetInOrg, requireOrg, requireOrgOrNull, requireUserId } from "./helpers";import {
  buildReportFacts,
  coerce,
  fmtNumber,
  groupBySum,
  monthlyBuckets,
} from "./analytics";
import type { Doc, Id } from "./_generated/dataModel";

// ---------- queries / mutations ----------

export const list = query({
  args: {},
  handler: async (ctx) => {
    const org = await requireOrgOrNull(ctx);
    if (!org) return [];
    return ctx.db
      .query("reports")
      .withIndex("by_org_created", (q) => q.eq("orgId", org._id))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, { reportId }) => {
    const org = await requireOrgOrNull(ctx);
    if (!org) throw new Error("Report not found");
    const report = await ctx.db.get(reportId);
    if (!report || report.orgId !== org._id) throw new Error("Report not found");
    return report;
  },
});

export const rate = mutation({
  args: { reportId: v.id("reports"), rating: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, { reportId, rating }) => {
    const org = await requireOrg(ctx);
    const report = await ctx.db.get(reportId);
    if (!report || report.orgId !== org._id) throw new Error("Report not found");
    await ctx.db.patch(reportId, { rating });
  },
});

export const remove = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, { reportId }) => {
    const org = await requireOrg(ctx);
    const report = await ctx.db.get(reportId);
    if (!report || report.orgId !== org._id) throw new Error("Report not found");
    await ctx.db.delete(reportId);
  },
});

// ---------- internal persistence helpers (called from the action) ----------

export const insertPending = mutation({
  args: {
    orgId: v.id("organizations"),
    datasetId: v.id("datasets"),
    title: v.string(),
    intent: v.string(),
  },
  handler: async (ctx, { orgId, datasetId, title, intent }) => {
    const userId = await requireUserId(ctx);
    const reportId: Id<"reports"> = await ctx.db.insert("reports", {
      orgId,
      datasetId,
      createdBy: userId,
      title,
      intent,
      status: "generating",
      createdAt: Date.now(),
    });
    return reportId;
  },
});

export const finalize = mutation({
  args: {
    reportId: v.id("reports"),
    headlineMetrics: v.array(
      v.object({
        label: v.string(),
        value: v.string(),
        change: v.optional(v.string()),
        direction: v.optional(v.union(v.literal("up"), v.literal("down"), v.literal("flat"))),
      }),
    ),
    narrative: v.object({
      headline: v.string(),
      summary: v.string(),
      watch: v.string(),
    }),
    insights: v.array(v.string()),
    charts: v.array(
      v.object({
        chartType: v.union(v.literal("bar"), v.literal("line"), v.literal("pie")),
        title: v.string(),
        data: v.array(v.object({ label: v.string(), value: v.number() })),
      }),
    ),
  },
  handler: async (ctx, { reportId, headlineMetrics, narrative, insights, charts }) => {
    await requireOrg(ctx);
    await ctx.db.patch(reportId, {
      status: "ready",
      headlineMetrics,
      narrative,
      insights,
      charts,
    });
  },
});

export const markFailed = mutation({
  args: { reportId: v.id("reports"), error: v.string() },
  handler: async (ctx, { reportId, error }) => {
    await requireOrg(ctx);
    await ctx.db.patch(reportId, { status: "failed", error });
  },
});

// ---------- deterministic chart building ----------

interface ReportChart {
  chartType: "bar" | "line" | "pie";
  title: string;
  data: { label: string; value: number }[];
}

function pct(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

/** Build up to 4 charts from the dataset, deterministically. */
function buildCharts(rows: unknown[][], cols: Doc<"datasets">["columns"]): ReportChart[] {
  const charts: ReportChart[] = [];
  const numCols = cols.filter((c) => c.type === "number");
  const dateCol = cols.find((c) => c.type === "date");
  const catCols = cols
    .filter((c) => c.type === "category" && c.uniqueCount >= 2)
    .sort((a, b) => a.uniqueCount - b.uniqueCount);

  if (dateCol && numCols.length) {
    const buckets = monthlyBuckets(rows, cols.indexOf(dateCol), cols.indexOf(numCols[0]));
    if (buckets.length >= 2) {
      charts.push({
        chartType: "line",
        title: `${numCols[0].name} by month`,
        data: buckets.map((b) => ({ label: b.label, value: b.value })),
      });
    }
  }

  if (catCols.length && numCols.length) {
    const series = groupBySum(rows, cols.indexOf(catCols[0]), cols.indexOf(numCols[0])).slice(0, 8);
    if (series.length >= 2) {
      charts.push({
        chartType: "bar",
        title: `${numCols[0].name} by ${catCols[0].name}`,
        data: series,
      });
    }
  }

  if (catCols.length >= 2) {
    const series = groupBySum(rows, cols.indexOf(catCols[1]), null).slice(0, 6);
    if (series.length >= 2) {
      charts.push({
        chartType: "pie",
        title: `Row share by ${catCols[1].name}`,
        data: series,
      });
    }
  }

  if (dateCol && numCols.length >= 2) {
    const buckets = monthlyBuckets(rows, cols.indexOf(dateCol), cols.indexOf(numCols[1]));
    if (buckets.length >= 2) {
      charts.push({
        chartType: "line",
        title: `${numCols[1].name} by month`,
        data: buckets.map((b) => ({ label: b.label, value: b.value })),
      });
    }
  }

  return charts.slice(0, 5);
}

// ---------- AI report generation ----------

export const generateReport = action({
  args: { datasetId: v.id("datasets"), intent: v.string() },
  handler: async (ctx, { datasetId, intent }) => {
    const dataset: Doc<"datasets"> = await ctx.runQuery(api.datasets.get, { datasetId });

    if (dataset.rowCount < 5) {
      throw new Error(
        "Dataset has fewer than 5 rows — too small to generate a meaningful report.",
      );
    }

    const rows: unknown[][] = dataset.rows.map((row) =>
      dataset.columns.map((c, i) => coerce(c.type, row[i])),
    );
    const facts = buildReportFacts(dataset, rows);
    const charts = buildCharts(rows, dataset.columns);

    // Deterministic headline metrics — LLM never recomputes these.
    const headlineMetrics: {
      label: string;
      value: string;
      change?: string;
      direction?: "up" | "down" | "flat";
    }[] = [];
    for (const m of facts.metrics.slice(0, 4)) {
      const trend = facts.trends.find((t) => t.column === m.column);
      headlineMetrics.push({
        label: `Total ${m.column}`,
        value: fmtNumber(m.sum),
        change: trend?.pctChange != null ? pct(trend.pctChange) : undefined,
        direction: trend?.direction ?? "flat",
      });
    }

    const reportId: Id<"reports"> = await ctx.runMutation(api.reports.insertPending, {
      orgId: dataset.orgId,
      datasetId,
      title: `${intent} — ${dataset.name}`,
      intent,
    });

    try {
      const { vly } = await import("../lib/vly-integrations");
      const prompt = `You are a senior business analyst writing a readable report for a small-business owner. You will receive a JSON fact pack of statistics that were computed deterministically from their dataset.

STRICT RULES:
- Use ONLY the numbers in the fact pack. NEVER invent, estimate, or calculate any number not present.
- Cite column names exactly as given.
- Write in plain English for a non-technical reader. Short sentences. No jargon.
- If the fact pack lacks information for a section, write fewer sentences rather than inventing.
- No markdown tables, no heading markup. Plain sentences. Use "•" bullets where asked.

Report intent from the user: "${intent}"

Fact pack JSON:
${JSON.stringify(facts)}

Write a report with EXACTLY these labeled sections, each on its own line:
HEADLINE: <one sentence summarizing the overall situation>
SUMMARY: <2-3 sentence overview of what the data covers and how it performed>
INSIGHTS: <3-5 bullets, each starting with "• ", each grounded in specific numbers from the fact pack>
WATCH: <1-3 sentences on what to monitor next, grounded in the fact pack>`;

      const completion = await vly.ai.completion({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "You are a precise business analyst. You never invent numbers." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        maxTokens: 1200,
      });

      if (!completion.success || !completion.data) {
        throw new Error(completion.error || "AI service unavailable");
      }

      const text = completion.data.choices?.[0]?.message?.content ?? "";
      const section = (name: string): string => {
        const m = text.match(new RegExp(`${name}:\\s*([\\s\\S]*?)(?=\\n[A-Z]{4,}:|$)`));
        return m?.[1]?.trim() || "";
      };

      const narrative = {
        headline: section("HEADLINE"),
        summary: section("SUMMARY"),
        watch: section("WATCH"),
      };

      const insights = section("INSIGHTS")
        .split("\n")
        .map((line) => line.replace(/^•?\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 5);

      await ctx.runMutation(api.reports.finalize, {
        reportId,
        headlineMetrics,
        narrative,
        insights,
        charts,
      });
      return reportId;
    } catch (e) {
      await ctx.runMutation(api.reports.markFailed, {
        reportId,
        error: e instanceof Error ? e.message : "Report generation failed",
      });
      throw e;
    }
  },
});
