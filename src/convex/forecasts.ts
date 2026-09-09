import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireDatasetInOrg } from "./helpers";
import type { Id } from "./_generated/dataModel";

// The forecast computation lives in forecastActions.ts (node runtime).

export const listForDataset = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const { dataset } = await requireDatasetInOrg(ctx, datasetId);
    return ctx.db
      .query("forecasts")
      .withIndex("by_dataset_time", (q) => q.eq("datasetId", dataset._id))
      .order("desc")
      .collect();
  },
});

export const insert = mutation({
  args: {
    datasetId: v.id("datasets"),
    metricColumn: v.string(),
    dateColumn: v.string(),
    horizon: v.number(),
    points: v.array(
      v.object({
        label: v.string(),
        value: v.number(),
        kind: v.union(v.literal("actual"), v.literal("forecast")),
        lower: v.optional(v.number()),
        upper: v.optional(v.number()),
      }),
    ),
    summary: v.string(),
  },
  handler: async (ctx, { datasetId, metricColumn, dateColumn, horizon, points, summary }) => {
    const { org } = await requireDatasetInOrg(ctx, datasetId);
    const forecastId: Id<"forecasts"> = await ctx.db.insert("forecasts", {
      orgId: org._id,
      datasetId,
      metricColumn,
      dateColumn,
      horizon,
      points,
      summary,
      createdAt: Date.now(),
    });
    return forecastId;
  },
});
