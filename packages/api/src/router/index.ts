import { router } from "../trpc";
import { postRouter } from "./post";
import { userRouter } from "./user";
import { likeRouter } from "./like";
import { saveRouter } from "./save";
import { followRouter } from "./follow";
import { commentRouter } from "./comment";
import { notificationRouter } from "./notification";

export const appRouter = router({
  post: postRouter,
  user: userRouter,
  like: likeRouter,
  save: saveRouter,
  follow: followRouter,
  comment: commentRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
