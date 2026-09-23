"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { computeAnswer, formatResult } from "./analytics";

type Computation = ReturnType<typeof computeAnswer>;

/**
 * Chat-with-data answer flow. The deterministic computation already ran in the
 * sendQuestion mutation; this action only phrases the pre-computed result with
 * the LLM and persists the assistant message. The LLM never sees raw rows and
 * never does arithmetic — if the LLM fails, a deterministic fallback is used.
 */
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
    if (!dataset) throw new Error("Dataset not found");
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
        result: result ?? null,
      },
      chart: computation.chart ?? undefined,
    });
  },
});
