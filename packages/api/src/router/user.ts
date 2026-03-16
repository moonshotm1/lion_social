import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const userRouter = router({
  /**
   * Get a user profile by ID, including follower/following/post counts.
   */
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      return user;
    }),

  /**
   * Get a user by username, including follower/following/post counts.
   */
  byUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { username: input.username },
        include: {
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      return user;
    }),

  /**
   * Get a user by their Supabase authentication ID.
   */
  bySupabaseId: publicProcedure
    .input(z.object({ supabaseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { supabaseId: input.supabaseId },
        include: {
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      return user;
    }),

  /**
   * Create a new user profile. Requires authentication.
   */
  create: protectedProcedure
    .input(
      z.object({
        supabaseId: z.string(),
        username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, {
          message: "Username can only contain letters, numbers, and underscores",
        }),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.create({
        data: {
          supabaseId: input.supabaseId,
          username: input.username,
          bio: input.bio,
          avatarUrl: input.avatarUrl,
        },
        include: {
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      return user;
    }),

  /**
   * Update own profile. Requires authentication.
   * Finds the user by the authenticated userId from context.
   */
  update: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, {
          message: "Username can only contain letters, numbers, and underscores",
        }).optional(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.userId },
        data: {
          ...(input.username !== undefined && { username: input.username }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        },
        include: {
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      return user;
    }),

  /**
   * Search users by username using case-insensitive partial matching.
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          username: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        take: input.limit,
        include: {
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
        orderBy: { username: "asc" },
      });

      return users;
    }),
});
