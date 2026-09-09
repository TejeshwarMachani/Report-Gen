import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireDatasetInOrg, requireOrg, requireUserId } from "./helpers";
import { computeAnswer, formatResult } from "./analytics";

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
// 1) mutation: persist user message + compute the deterministic answer
// 2) action: phrase the computed result with the LLM and persist the reply

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

type Computation = ReturnType<typeof computeAnswer>;

export const answerQuestion = action({
  args: {
    datasetId: v.id("datasets"),
    computation: v.any(),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, { datasetId, computation, history }) => {
    const dataset = await ctx.runQuery(api.datasets.get, { datasetId });
    const { kind, description, result } = computation as Computation;

    // Deterministic fallback answer (never invents numbers).
    let fallback: string;
    if (kind === "unsupported") {
      fallback = `I can answer questions that map to a safe aggregation over your columns — totals, averages, min/max, counts, group-bys, or monthly trends. Try asking things like "What is the total of [column]?" or "[metric] by [category]".`;
    } else if (result === null || result === undefined) {
      fallback = `I couldn't compute that from the current data. ${description}`;
    } else {
      fallback = `Result: ${formatResult(result)}`;
    }

    let content = fallback;
    try {
      const { vly } = await import("../lib/vly-integrations");
      const completion = await vly.ai.completion({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You phrase pre-computed data answers for a business user. Use ONLY the provided computed result — never invent or calculate new numbers. One to three short sentences. Plain English.",
          },
          {
            role: "user",
            content: `Dataset: ${dataset.name}
Columns: ${dataset.columns.map((c) => `${c.name} (${c.type})`).join(", ")}

Recent conversation:
${history
  .slice(-6)
  .map((h) => `${h.role}: ${h.content}`)
  .join("\n")}

Question asked: "${history[history.length - 1]?.content ?? ""}"
Computation that ran: ${kind} — ${description}
Computed result (authoritative): ${JSON.stringify(result)}

Write the assistant reply. If the result is null, say the data couldn't answer it and suggest what to ask instead.`,
          },
        ],
        temperature: 0.2,
        maxTokens: 350,
      });

      if (completion.success && completion.data) {
        const text = completion.data.choices?.[0]?.message?.content ?? "";
        if (text.trim()) content = text.trim();
      }
    } catch {
      // Keep deterministic fallback on LLM failure.
    }

    await ctx.runMutation(api.chat.insertAssistantMessage, {
      datasetId,
      content,
      query: {
        kind,
        description,
        result: (result ?? null) as any,
      },
      chart: computation.chart ?? undefined,
    });
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
    const org = await requireOrg(ctx);
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
