import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const columnTypeValidator = v.union(
  v.literal("number"),
  v.literal("date"),
  v.literal("category"),
  v.literal("text"),
);
export type ColumnType = Infer<typeof columnTypeValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ---- Business reporting app tables ----

    // One workspace per user (v1: the creator is the owner). Extensible to
    // team members + plans (monetization data model) post-v1.
    organizations: defineTable({
      name: v.string(),
      ownerUserId: v.id("users"),
      plan: v.optional(v.string()), // "free" | future paid tiers
    }).index("by_owner", ["ownerUserId"]),

    // Datasets: file metadata + parsed schema + sampled rows. Parsing happens
    // client-side (papaparse / xlsx), rows beyond the sample stay in the file.
    datasets: defineTable({
      orgId: v.id("organizations"),
      uploadedBy: v.id("users"),
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
      createdAt: v.number(),
    })
      .index("by_org", ["orgId", "createdAt"])
      .index("by_org_created", ["orgId"]),

    // Generated AI reports (LLM narrates pre-computed stats only).
    reports: defineTable({
      orgId: v.id("organizations"),
      datasetId: v.id("datasets"),
      createdBy: v.id("users"),
      title: v.string(),
      intent: v.string(),
      status: v.union(
        v.literal("generating"),
        v.literal("ready"),
        v.literal("failed"),
      ),
      error: v.optional(v.string()),
      headlineMetrics: v.optional(
        v.array(
          v.object({
            label: v.string(),
            value: v.string(),
            change: v.optional(v.string()),
            direction: v.optional(v.union(v.literal("up"), v.literal("down"), v.literal("flat"))),
          }),
        ),
      ),
      narrative: v.optional(
        v.object({
          headline: v.string(),
          summary: v.string(),
          watch: v.string(),
        }),
      ),
      insights: v.optional(v.array(v.string())),
      charts: v.optional(
        v.array(
          v.object({
            chartType: v.union(v.literal("bar"), v.literal("line"), v.literal("pie")),
            title: v.string(),
            data: v.array(v.object({ label: v.string(), value: v.number() })),
          }),
        ),
      ),
      rating: v.optional(v.union(v.literal("up"), v.literal("down"))),
      createdAt: v.number(),
    })
      .index("by_org_created", ["orgId", "createdAt"])
      .index("by_dataset", ["datasetId", "createdAt"]),

    // Chat with data: one conversation per dataset (v1 keeps it simple).
    chatMessages: defineTable({
      orgId: v.id("organizations"),
      datasetId: v.id("datasets"),
      userId: v.id("users"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      // Transparency: the deterministic computation behind an assistant answer.
      query: v.optional(
        v.object({
          kind: v.string(), // e.g. "group-by", "aggregate", "top-n", "trend", "filter", "raw-sample", "unsupported"
          description: v.string(),
          result: v.optional(v.any()),
        }),
      ),
      chart: v.optional(
        v.object({
          chartType: v.union(v.literal("bar"), v.literal("line"), v.literal("pie")),
          title: v.string(),
          data: v.array(v.object({ label: v.string(), value: v.number() })),
        }),
      ),
      createdAt: v.number(),
    })
      .index("by_dataset_time", ["datasetId", "createdAt"]),

    // Deterministic linear-trend forecasts.
    forecasts: defineTable({
      orgId: v.id("organizations"),
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
      createdAt: v.number(),
    }).index("by_dataset_time", ["datasetId", "createdAt"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
