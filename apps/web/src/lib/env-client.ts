// Client-side demo mode detection (only uses NEXT_PUBLIC_ vars).
// DATABASE_URL is server-only, so the Clerk key is the client-side proxy.
export const isClientDemoMode =
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
