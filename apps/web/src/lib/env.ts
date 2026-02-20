// Server-side environment config & demo mode detection.
// When Supabase URL or DATABASE_URL is missing the app runs in demo mode
// and all data comes from mock-data.ts.

export const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.DATABASE_URL;

export const env = {
  isDemoMode,
  databaseUrl: process.env.DATABASE_URL ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};
