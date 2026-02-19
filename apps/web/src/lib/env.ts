// Server-side environment config & demo mode detection.
// When any required backend key is missing the app runs in demo mode
// and all data comes from mock-data.ts.

export const isDemoMode =
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.DATABASE_URL;

export const env = {
  isDemoMode,
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};
