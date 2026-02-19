import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const likeRouter = router({
  /**
   * Toggle a like on a post.
   * If the user has already liked the post, the like is removed.
   * If the user has not liked the post, a new like is created.
   */
  toggle: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingLike = await ctx.prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: ctx.userId,
            postId: input.postId,
          },
        },
      });

      if (existingLike) {
        await ctx.prisma.like.delete({
          where: { id: existingLike.id },
        });

        return { liked: false };
      }

      await ctx.prisma.like.create({
        data: {
          userId: ctx.userId,
          postId: input.postId,
        },
      });

      return { liked: true };
    }),

  /**
   * Get all likes for a specific post, including user information.
   */
  byPost: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const likes = await ctx.prisma.like.findMany({
        where: { postId: input.postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return likes;
    }),
});
