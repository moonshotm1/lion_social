import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isDemoMode = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default async function middleware(request: NextRequest) {
  if (isDemoMode) {
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/explore",
    "/profile/(.*)",
    "/api/trpc(.*)",
  ]);

  return (clerkMiddleware as any)(async (auth: any, req: any) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  })(request);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
