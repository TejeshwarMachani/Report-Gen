import { getAuthUserId } from "@convex-dev/auth/server";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

type AnyCtx = QueryCtx | MutationCtx;

export async function requireUserId(ctx: AnyCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** Read-only: returns the user's org or null (queries cannot create). */
export async function getOrgReadOnly(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<Doc<"organizations"> | null> {
  return ctx.db
    .query("organizations")
    .withIndex("by_owner", (q) => q.eq("ownerUserId", userId))
    .first();
}

/** Get-or-create the user's single-org workspace (mutations only). */
export async function getOrgForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"organizations">> {
  const existing = await getOrgReadOnly(ctx, userId);
  if (existing) return existing;

  const user = await ctx.db.get(userId);
  const label = user?.name || user?.email || "My";
  const orgId = await ctx.db.insert("organizations", {
    name: `${label.split(" ")[0]}'s Workspace`,
    ownerUserId: userId,
    plan: "free",
  });
  return (await ctx.db.get(orgId))!;
}

/** Mutations: auth-checked org, created lazily if needed. */
export async function requireOrg(ctx: MutationCtx): Promise<Doc<"organizations">> {
  const userId = await requireUserId(ctx);
  return getOrgForUser(ctx, userId);
}

/** Queries: auth-checked org; returns null when the user has none yet. */
export async function requireOrgOrNull(ctx: QueryCtx): Promise<Doc<"organizations"> | null> {
  const userId = await requireUserId(ctx);
  return getOrgReadOnly(ctx, userId);
}

/** Queries/mutations: throws unless the dataset exists and belongs to the caller's org. */
export async function requireDatasetInOrg(
  ctx: AnyCtx,
  datasetId: Id<"datasets">,
): Promise<{ org: Doc<"organizations">; dataset: Doc<"datasets"> }> {
  const userId = await requireUserId(ctx);
  const dataset = await ctx.db.get(datasetId);
  if (!dataset) throw new Error("Dataset not found");
  const org = await getOrgReadOnly(ctx, userId);
  if (!org || dataset.orgId !== org._id) throw new Error("Dataset not found");
  return { org, dataset };
}
