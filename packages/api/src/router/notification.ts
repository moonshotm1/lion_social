import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const notificationRouter = router({
  /**
   * Get notifications for the current authenticated user.
   * Ordered by newest first with cursor-based pagination.
   */
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }).default({})
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const notifications = await ctx.prisma.notification.findMany({
        where: { userId: ctx.userId },
        take: limit + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  /**
   * Mark a single notification as read.
   */
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.update({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
        data: { read: true },
      });

      return notification;
    }),

  /**
   * Mark all notifications as read for the current user.
   */
  markAllRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await ctx.prisma.notification.updateMany({
        where: {
          userId: ctx.userId,
          read: false,
        },
        data: { read: true },
      });

      return { success: true };
    }),

  /**
   * Get the count of unread notifications for the current user.
   */
  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const count = await ctx.prisma.notification.count({
        where: {
          userId: ctx.userId,
          read: false,
        },
      });

      return { count };
    }),
});
