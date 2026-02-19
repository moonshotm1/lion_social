// Clerk middleware — disabled until API keys are configured.
// Uncomment the below once you add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to .env

// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
//
// const isPublicRoute = createRouteMatcher([
//   "/",
//   "/sign-in(.*)",
//   "/sign-up(.*)",
//   "/explore",
//   "/profile/(.*)",
//   "/api/trpc(.*)",
// ]);
//
// export default clerkMiddleware(async (auth, request) => {
//   if (!isPublicRoute(request)) {
//     await auth.protect();
//   }
// });

export const config = {
  matcher: [],
};
