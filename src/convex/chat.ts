import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireDatasetInOrg, requireUserId } from "./helpers";
import { computeAnswer } from "./analytics";

// LLM phrasing of answers lives in chatActions.ts (node runtime).

// ---------- queries ----------

export const listMessages = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, { datasetId }) => {
    const { dataset } = await requireDatasetInOrg(ctx, datasetId);
    return ctx.db
      .query("chatMessages")
      .withIndex("by_dataset_time", (q) => q.eq("datasetId", dataset._id))
      .order("asc")
      .collect();
  },
});

// ---------- ask flow ----------
// 1) sendQuestion mutation: persists user message + computes the deterministic answer
// 2) answerQuestion action (chatActions.ts): phrases the result with the LLM

export const sendQuestion = mutation({
  args: { datasetId: v.id("datasets"), question: v.string() },
  handler: async (ctx, { datasetId, question }) => {
    const { org, dataset } = await requireDatasetInOrg(ctx, datasetId);
    const userId = await requireUserId(ctx);
    const q = question.trim();
    if (!q) throw new Error("Empty question");

    const userMsgId = await ctx.db.insert("chatMessages", {
      orgId: org._id,
      datasetId,
      userId,
      role: "user",
      content: q,
      createdAt: Date.now(),
    });

    const computation = computeAnswer(dataset, q);
    return { userMsgId, computation };
  },
});

export const insertAssistantMessage = mutation({
  args: {
    datasetId: v.id("datasets"),
    content: v.string(),
    query: v.object({
      kind: v.string(),
      description: v.string(),
      result: v.any(),
    }),
    chart: v.optional(
      v.object({
        chartType: v.union(v.literal("bar"), v.literal("line"), v.literal("pie")),
        title: v.string(),
        data: v.array(v.object({ label: v.string(), value: v.number() })),
      }),
    ),
  },
  handler: async (ctx, { datasetId, content, query: q, chart }) => {
    const { org } = await requireDatasetInOrg(ctx, datasetId);
    const userId = await requireUserId(ctx);
    await ctx.db.insert("chatMessages", {
      orgId: org._id,
      datasetId,
      userId,
      role: "assistant",
      content,
      query: q,
      chart,
      createdAt: Date.now(),
    });
  },
});
