import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireDatasetInOrg, requireOrg, requireOrgOrNull, requireUserId } from "./helpers";
import type { Id } from "./_generated/dataModel";

// AI report generation lives in reportActions.ts (node runtime).

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

// Returns null (instead of throwing) when the report is missing or belongs to
// another workspace, so the UI can render a friendly not-found state.
export const get = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, { reportId }) => {
    const org = await requireOrgOrNull(ctx);
    if (!org) return null;
    const report = await ctx.db.get(reportId);
    if (!report || report.orgId !== org._id) return null;
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

// ---------- internal persistence helpers (called from reportActions) ----------

export const insertPending = mutation({
  args: {
    datasetId: v.id("datasets"),
    title: v.string(),
    intent: v.string(),
  },
  handler: async (ctx, { datasetId, title, intent }) => {
    const { org } = await requireDatasetInOrg(ctx, datasetId);
    const userId = await requireUserId(ctx);
    const reportId: Id<"reports"> = await ctx.db.insert("reports", {
      orgId: org._id,
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
    const org = await requireOrg(ctx);
    const report = await ctx.db.get(reportId);
    if (!report || report.orgId !== org._id) throw new Error("Report not found");
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
    const org = await requireOrg(ctx);
    const report = await ctx.db.get(reportId);
    if (!report || report.orgId !== org._id) throw new Error("Report not found");
    await ctx.db.patch(reportId, { status: "failed", error });
  },
});
