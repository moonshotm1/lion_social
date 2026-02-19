import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@lion/api";
import { prisma } from "@lion/database";

const isDemoMode =
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.DATABASE_URL;

const handler = async (req: Request) => {
  if (isDemoMode) {
    return new Response(
      JSON.stringify({
        error: "Backend not configured. Running in demo mode.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // Dynamically import Clerk auth only when keys exist
  const { auth } = await import("@clerk/nextjs/server");

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const { userId: clerkUserId } = await auth();

      let userId: string | null = null;
      if (clerkUserId) {
        const user = await prisma.user.findUnique({
          where: { clerkId: clerkUserId },
          select: { id: true },
        });
        userId = user?.id ?? null;
      }

      return createContext({ prisma, userId });
    },
  });
};

export { handler as GET, handler as POST };
