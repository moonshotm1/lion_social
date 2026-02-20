"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isClientDemoMode } from "@/lib/env-client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{ session: null, user: null, isLoading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    import("@/lib/supabase").then(({ createSupabaseBrowserClient }) => {
      const supabase = createSupabaseBrowserClient();

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setIsLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setIsLoading(false);
      });

      unsubscribe = () => subscription.unsubscribe();
    });

    return () => unsubscribe?.();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const AuthProvider = isClientDemoMode
  ? DemoAuthProvider
  : SupabaseAuthProvider;
