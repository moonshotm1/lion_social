// Client-side demo mode detection (only uses NEXT_PUBLIC_ vars).
export const isClientDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL;
