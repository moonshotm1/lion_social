import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const postRouter = router({
  /**
   * Infinite-scroll feed with cursor-based pagination.
   * Returns posts ordered by newest first, with user, like count, and comment count.
   */
  feed: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const posts = await ctx.prisma.post.findMany({
        take: limit + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),

  /**
   * Get a single post by its ID, including user, likes, and comments.
   */
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          likes: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return post;
    }),

  /**
   * Get all posts by a specific user.
   */
  byUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, cursor, limit } = input;

      const posts = await ctx.prisma.post.findMany({
        where: { userId },
        take: limit + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),

  /**
   * Create a new post. Requires authentication.
   */
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["workout", "meal", "quote", "story"]),
        caption: z.string().min(1).max(2000),
        imageUrl: z.string().url().optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.create({
        data: {
          userId: ctx.userId,
          type: input.type,
          caption: input.caption,
          imageUrl: input.imageUrl,
          metadata: input.metadata ?? undefined,
        },
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return post;
    }),

  /**
   * Delete a post. Only the post owner can delete it.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });

      if (!post) {
        throw new Error("Post not found");
      }

      if (post.userId !== ctx.userId) {
        throw new Error("You can only delete your own posts");
      }

      await ctx.prisma.post.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get trending posts sorted by most likes in the past 7 days.
   */
  trending: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const posts = await ctx.prisma.post.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        take: input.limit,
        orderBy: {
          likes: {
            _count: "desc",
          },
        },
        include: {
          user: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return posts;
    }),
});
