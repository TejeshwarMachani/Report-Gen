import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { columnTypeValidator } from "./schema";
import { getOrgReadOnly, requireDatasetInOrg, requireOrg, requireOrgOrNull, requireUserId } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const org = await requireOrgOrNull(ctx);
    if (!org) return [];
    return ctx.db
      .query("datasets")
      .withIndex("by_org", (q) => q.eq("orgId", org._id))
      .order("desc")
      .collect();
  },
});

// Returns null (instead of throwing) when the dataset is missing or belongs to
// another workspace, so the UI can render a friendly not-found state.
export const get = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const userId = await requireUserId(ctx);
    const dataset = await ctx.db.get(datasetId);
    if (!dataset) return null;
    const org = await getOrgReadOnly(ctx, userId);
    if (!org || dataset.orgId !== org._id) return null;
    return dataset;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    rowCount: v.number(),
    columns: v.array(
      v.object({
        name: v.string(),
        type: columnTypeValidator,
        missingCount: v.number(),
        uniqueCount: v.number(),
        sample: v.array(v.string()),
      }),
    ),
    rows: v.array(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const org = await requireOrg(ctx);
    const userId = await requireUserId(ctx);
    const datasetId = await ctx.db.insert("datasets", {
      orgId: org._id,
      uploadedBy: userId,
      name: args.name.trim() || args.fileName,
      fileName: args.fileName,
      fileSize: args.fileSize,
      rowCount: args.rowCount,
      columns: args.columns,
      rows: args.rows,
      createdAt: Date.now(),
    });
    return datasetId;
  },
});

export const rename = mutation({
  args: { datasetId: v.id("datasets"), name: v.string() },
  handler: async (ctx, { datasetId, name }) => {
    await requireDatasetInOrg(ctx, datasetId);
    await ctx.db.patch(datasetId, { name: name.trim() });
  },
});

export const remove = mutation({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const { org } = await requireDatasetInOrg(ctx, datasetId);
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_dataset", (q) => q.eq("datasetId", datasetId))
      .collect();
    for (const r of reports) {
      if (r.orgId === org._id) await ctx.db.delete(r._id);
    }
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_dataset_time", (q) => q.eq("datasetId", datasetId))
      .collect();
    for (const m of messages) {
      if (m.orgId === org._id) await ctx.db.delete(m._id);
    }
    const forecasts = await ctx.db
      .query("forecasts")
      .withIndex("by_dataset_time", (q) => q.eq("datasetId", datasetId))
      .collect();
    for (const f of forecasts) {
      if (f.orgId === org._id) await ctx.db.delete(f._id);
    }
    await ctx.db.delete(datasetId);
  },
});
