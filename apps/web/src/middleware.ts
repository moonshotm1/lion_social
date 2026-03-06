import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function middleware(request: NextRequest) {
  // In demo mode there is no Supabase session — pass everything through.
  if (isDemoMode) {
    return NextResponse.next();
  }

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
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[]
          ) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(
                name,
                value,
                options as Parameters<typeof supabaseResponse.cookies.set>[2]
              )
            );
          },
        },
      }
    );

    // Refresh session tokens via cookies
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Routes that are accessible without a session
    const isAuthPage =
      pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

    const isPublicApiRoute =
      pathname.startsWith("/api/trpc") ||
      pathname.startsWith("/api/auth/") ||
      pathname.startsWith("/api/invite/") ||
      pathname.startsWith("/api/upload") ||
      pathname.startsWith("/api/profile") ||
      pathname.startsWith("/api/post/") ||
      pathname.startsWith("/api/user/") ||
      pathname.startsWith("/api/notifications") ||
      pathname.startsWith("/auth/callback");

    // Unauthenticated user hitting a protected page → sign-in
    if (!user && !isAuthPage && !isPublicApiRoute) {
      const signInUrl = new URL("/sign-in", request.url);
      // Preserve the intended destination so we can redirect after login
      if (pathname !== "/sign-in") {
        signInUrl.searchParams.set("redirect_to", pathname);
      }
      return NextResponse.redirect(signInUrl);
    }

    // Authenticated user hitting sign-in or sign-up → home feed
    if (user && isAuthPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return supabaseResponse;
  } catch (err) {
    // Never return an HTML error page for API routes
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
