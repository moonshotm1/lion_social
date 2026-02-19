import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

// Type placeholder - will be replaced with actual AppRouter type from @lion/api
type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:3000`;
}

export function getTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers() {
          return {
            "x-trpc-source": "nextjs-react",
          };
        },
      }),
    ],
  });
}

/**
 * tRPC provider configuration for the app.
 *
 * Usage in a provider component:
 * ```tsx
 * const [queryClient] = useState(() => new QueryClient());
 * const [trpcClient] = useState(() => getTrpcClient());
 *
 * return (
 *   <trpc.Provider client={trpcClient} queryClient={queryClient}>
 *     <QueryClientProvider client={queryClient}>
 *       {children}
 *     </QueryClientProvider>
 *   </trpc.Provider>
 * );
 * ```
 */
