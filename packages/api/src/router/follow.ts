import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const followRouter = router({
  /**
   * Toggle follow/unfollow a user.
   * If already following, unfollows. If not following, follows.
   * Prevents a user from following themselves.
   */
  toggle: protectedProcedure
    .input(z.object({ targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.userId === input.targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot follow yourself",
        });
      }

      const existingFollow = await ctx.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.userId,
            followingId: input.targetUserId,
          },
        },
      });

      if (existingFollow) {
        await ctx.prisma.follow.delete({
          where: { id: existingFollow.id },
        });

        return { following: false };
      }

      await ctx.prisma.follow.create({
        data: {
          followerId: ctx.userId,
          followingId: input.targetUserId,
        },
      });

      return { following: true };
    }),

  /**
   * Get all followers of a user.
   */
  followers: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, cursor, limit } = input;

      const follows = await ctx.prisma.follow.findMany({
        where: { followingId: userId },
        take: limit + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        orderBy: { createdAt: "desc" },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              bio: true,
              avatarUrl: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (follows.length > limit) {
        const nextItem = follows.pop();
        nextCursor = nextItem?.id;
      }

      return {
        followers: follows.map((f) => f.follower),
        nextCursor,
      };
    }),

  /**
   * Get all users that a specific user follows.
   */
  following: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, cursor, limit } = input;

      const follows = await ctx.prisma.follow.findMany({
        where: { followerId: userId },
        take: limit + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        orderBy: { createdAt: "desc" },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              bio: true,
              avatarUrl: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (follows.length > limit) {
        const nextItem = follows.pop();
        nextCursor = nextItem?.id;
      }

      return {
        following: follows.map((f) => f.following),
        nextCursor,
      };
    }),

  /**
   * Check if the current authenticated user is following a target user.
   */
  isFollowing: publicProcedure
    .input(
      z.object({
        followerId: z.string(),
        followingId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const follow = await ctx.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: input.followerId,
            followingId: input.followingId,
          },
        },
      });

      return { isFollowing: !!follow };
    }),
});
