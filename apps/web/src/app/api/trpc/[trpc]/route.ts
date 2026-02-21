import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@lion/api";
import { prisma } from "@lion/database";
import { createSupabaseServerClient } from "@/lib/supabase";

const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.DATABASE_URL;

const handler = async (req: Request) => {
  if (isDemoMode) {
    return new Response(
      JSON.stringify({
        error: "Backend not configured. Running in demo mode.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    onError({ error, path }) {
      console.error(`[tRPC] Error on ${path ?? "unknown"}:`, error);
    },
    createContext: async () => {
      // Wrap entirely so a Supabase/DB hiccup never causes an HTML 500 response.
      // If anything fails, we return an unauthenticated context and let the
      // individual procedures handle auth requirements via TRPCError.
      try {
        const supabase = await createSupabaseServerClient();
        const {
          data: { user: supabaseUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("[tRPC] Supabase getUser error:", authError.message);
          return createContext({ prisma, userId: null });
        }

        let userId: string | null = null;
        if (supabaseUser) {
          let user = await prisma.user.findUnique({
            where: { supabaseId: supabaseUser.id },
            select: { id: true },
          });

          // Auto-create profile on first authenticated request if it doesn't exist
          if (!user) {
            const base =
              supabaseUser.user_metadata?.username ||
              supabaseUser.email?.split("@")[0] ||
              `user_${supabaseUser.id.slice(0, 8)}`;
            let username = base as string;
            // If username is taken, fall back to a unique handle
            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing) username = `user_${supabaseUser.id.slice(0, 8)}`;
            try {
              user = await prisma.user.create({
                data: { supabaseId: supabaseUser.id, username },
                select: { id: true },
              });
            } catch {
              // Race condition: another request created it first — just look it up
              user = await prisma.user.findUnique({
                where: { supabaseId: supabaseUser.id },
                select: { id: true },
              });
            }
          }

          userId = user?.id ?? null;
        }

        return createContext({ prisma, userId });
      } catch (err) {
        console.error("[tRPC] createContext error:", err);
        return createContext({ prisma, userId: null });
      }
    },
  });
};

export { handler as GET, handler as POST };
