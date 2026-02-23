import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function middleware(request: NextRequest) {
  if (isDemoMode) {
    return NextResponse.next();
  }

  // If the middleware crashes for any reason, let the request through
  // rather than returning an HTML error page that breaks API routes.
  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh the session (updates expired tokens via cookies)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Public routes that don't require authentication
    const isPublicRoute =
      request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname.startsWith("/sign-in") ||
      request.nextUrl.pathname.startsWith("/sign-up") ||
      request.nextUrl.pathname.startsWith("/explore") ||
      request.nextUrl.pathname.startsWith("/profile/") ||
      request.nextUrl.pathname.startsWith("/api/trpc") ||
      request.nextUrl.pathname.startsWith("/api/auth/") ||
      request.nextUrl.pathname.startsWith("/auth/callback");

    if (!user && !isPublicRoute) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_to", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    return supabaseResponse;
  } catch (err) {
    console.error("[Middleware] Error — passing request through:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
