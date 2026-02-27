import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const saveRouter = router({
  /**
   * Toggle a save/bookmark on a post for the current user.
   */
  toggle: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.save.findUnique({
        where: {
          userId_postId: {
            userId: ctx.userId,
            postId: input.postId,
          },
        },
      });

      if (existing) {
        await ctx.prisma.save.delete({ where: { id: existing.id } });
        return { saved: false };
      }

      await ctx.prisma.save.create({
        data: { userId: ctx.userId, postId: input.postId },
      });

      return { saved: true };
    }),

  /**
   * Get all posts saved by a specific user.
   */
  byUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const saves = await ctx.prisma.save.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            include: {
              user: true,
              likes: ctx.userId
                ? { where: { userId: ctx.userId }, select: { id: true } }
                : false,
              saves: ctx.userId
                ? { where: { userId: ctx.userId }, select: { id: true } }
                : false,
              _count: { select: { likes: true, comments: true, saves: true } },
            },
          },
        },
      });

      return saves.map((s) => s.post);
    }),
});
