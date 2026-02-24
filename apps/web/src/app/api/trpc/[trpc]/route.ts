import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@lion/api";
import { prisma } from "@lion/database";
import { createSupabaseServerClient } from "@/lib/supabase";

const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

const handler = async (req: Request) => {
  const url = new URL(req.url);
  console.log(`[tRPC] ${req.method} ${url.pathname}`);

  if (isDemoMode) {
    console.log("[tRPC] Running in demo mode — no Supabase configured");
    const demoError = {
      message: "Backend not configured. Running in demo mode.",
      code: -32603,
      data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 503 },
    };
    return new Response(
      JSON.stringify([{ error: { json: demoError } }]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      onError({ error, path }) {
        console.error(`[tRPC] Procedure error on "${path ?? "unknown"}":`, error.message);
      },
      createContext: async () => {
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

            if (!user) {
              const base =
                supabaseUser.user_metadata?.username ||
                supabaseUser.email?.split("@")[0] ||
                `user_${supabaseUser.id.slice(0, 8)}`;
              let username = base as string;
              const existing = await prisma.user.findUnique({ where: { username } });
              if (existing) username = `user_${supabaseUser.id.slice(0, 8)}`;
              try {
                user = await prisma.user.create({
                  data: { supabaseId: supabaseUser.id, username },
                  select: { id: true },
                });
                console.log("[tRPC] Auto-created user profile:", username);
              } catch {
                user = await prisma.user.findUnique({
                  where: { supabaseId: supabaseUser.id },
                  select: { id: true },
                });
              }
            }

            userId = user?.id ?? null;
            console.log("[tRPC] Resolved userId:", userId ?? "(unauthenticated)");
          }

          return createContext({ prisma, userId });
        } catch (err) {
          console.error("[tRPC] createContext threw:", err);
          return createContext({ prisma, userId: null });
        }
      },
    });
  } catch (err) {
    // fetchRequestHandler itself threw — return JSON so the client never sees HTML.
    console.error("[tRPC] fetchRequestHandler threw:", err);
    const errObj = { message: String(err), code: -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 } };
    return new Response(
      JSON.stringify([{ error: { json: errObj } }]),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export { handler as GET, handler as POST };
