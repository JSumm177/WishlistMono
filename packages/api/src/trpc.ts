import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "@wishlist/db";

export const createTRPCContext = async (opts: {
  headers: Headers;
  userId: string | null;
}) => {
  return {
    db,
    userId: opts.userId,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
