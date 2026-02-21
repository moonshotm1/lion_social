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
    createContext: async () => {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

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
    },
  });
};

export { handler as GET, handler as POST };
