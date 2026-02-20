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
        const user = await prisma.user.findUnique({
          where: { supabaseId: supabaseUser.id },
          select: { id: true },
        });
        userId = user?.id ?? null;
      }

      return createContext({ prisma, userId });
    },
  });
};

export { handler as GET, handler as POST };
