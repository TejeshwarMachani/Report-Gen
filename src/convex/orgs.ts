import { query } from "./_generated/server";
import { getOrgReadOnly, requireUserId } from "./helpers";

/** Get the signed-in user's workspace; creates one on first mutation elsewhere. */
export const getOrCreate = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return getOrgReadOnly(ctx, userId);
  },
});
