import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const commentRouter = router({
  /**
   * Get all comments for a specific post, including user info.
   * Ordered by oldest first for natural conversation flow.
   */
  byPost: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { postId, cursor, limit } = input;

      const comments = await ctx.prisma.comment.findMany({
        where: { postId },
        take: limit + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (comments.length > limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem?.id;
      }

      return {
        comments,
        nextCursor,
      };
    }),

  /**
   * Add a comment to a post. Requires authentication.
   */
  create: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.create({
        data: {
          userId: ctx.userId,
          postId: input.postId,
          content: input.content,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      return comment;
    }),

  /**
   * Delete a comment. Only the comment owner can delete it.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!comment) {
        throw new Error("Comment not found");
      }

      if (comment.userId !== ctx.userId) {
        throw new Error("You can only delete your own comments");
      }

      await ctx.prisma.comment.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
