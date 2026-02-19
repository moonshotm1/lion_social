import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const middleware = t.middleware;

/**
 * Public (unauthenticated) procedure - accessible to all callers.
 */
export const publicProcedure = t.procedure;

/**
 * Middleware that enforces the caller is authenticated.
 * Throws UNAUTHORIZED if userId is not present in context.
 */
const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Protected (authenticated) procedure - requires a valid userId in context.
 */
export const protectedProcedure = t.procedure.use(isAuthed);
