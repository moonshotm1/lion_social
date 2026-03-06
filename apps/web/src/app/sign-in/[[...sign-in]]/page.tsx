"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { isClientDemoMode } from "@/lib/env-client";
import { LionLogo } from "@/components/ui/lion-logo";

// ─── Shared header shown on both demo and real sign-in ──────────────────────

function AuthHeader() {
  return (
    <div className="flex flex-col items-center gap-4 mb-10">
      {/* Logo with glow */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-lion-gold/20 blur-xl scale-110" />
        <LionLogo size={80} withBackground className="relative rounded-2xl shadow-gold-lg" />
      </div>

      <div className="text-center space-y-1">
        <h1
          className="text-4xl font-bold text-gold-gradient tracking-wide"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          GAINS
        </h1>
        <p className="text-sm text-lion-gray-3 tracking-wide">
          The exclusive wellness community
        </p>
      </div>
    </div>
  );
}

// ─── Demo mode notice ────────────────────────────────────────────────────────

function DemoSignIn() {
  return (
    <div className="w-full max-w-sm">
      <AuthHeader />
      <div className="rounded-2xl bg-lion-dark-2 border border-lion-dark-4 p-8 space-y-5">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-lion-gold/10 border border-lion-gold/20 text-xs font-semibold text-lion-gold uppercase tracking-widest">
            Demo Mode
          </span>
          <h2 className="text-lg font-bold text-lion-white mt-3">Welcome back</h2>
          <p className="text-sm text-lion-gray-3 leading-relaxed">
            Add your Supabase credentials to{" "}
            <code className="text-lion-gold bg-lion-dark-3 px-1.5 py-0.5 rounded text-xs">.env.local</code>{" "}
            to enable sign-in.
          </p>
        </div>

        {/* Faded form placeholder */}
        <div className="space-y-3 opacity-40 pointer-events-none select-none">
          <div className="h-11 rounded-xl bg-lion-dark-3 border border-lion-dark-4" />
          <div className="h-11 rounded-xl bg-lion-dark-3 border border-lion-dark-4" />
          <div className="h-11 rounded-xl bg-gold-gradient" />
        </div>

        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-sm text-lion-gold hover:text-lion-gold-light font-medium transition-colors"
          >
            ← Continue to demo feed
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Real Supabase sign-in ────────────────────────────────────────────────────

function SupabaseSignInInner() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to") || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase");
      const supabase = createSupabaseBrowserClient();

      let email = identifier.trim();
      if (!email.includes("@")) {
        const res = await fetch(
          `/api/auth/email-by-username?username=${encodeURIComponent(email.toLowerCase())}`
        );
        if (!res.ok) {
          setError("No account found with that username.");
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        email = data.email;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("wrong password")) {
          setError("Incorrect password. Please try again.");
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      await fetch("/api/auth/ensure-profile", { method: "POST" });
      window.location.href = redirectTo;
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <AuthHeader />

      <div className="rounded-2xl bg-lion-dark-2 border border-lion-dark-4 p-8">
        <div className="text-center mb-8">
          <h2
            className="text-xl font-bold text-lion-white"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Sign in to the Pack
          </h2>
          <p className="text-sm text-lion-gray-3 mt-1.5">
            Use your email or username
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="identifier"
              className="block text-xs font-semibold text-lion-gray-4 uppercase tracking-wider"
            >
              Email or Username
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              placeholder="you@example.com or @username"
              className="w-full px-4 py-3 rounded-xl bg-lion-dark-3 border border-lion-dark-4 text-lion-white placeholder:text-lion-gray-2 focus:outline-none focus:border-lion-gold/40 focus:ring-1 focus:ring-lion-gold/20 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-lion-gray-4 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl bg-lion-dark-3 border border-lion-dark-4 text-lion-white placeholder:text-lion-gray-2 focus:outline-none focus:border-lion-gold/40 focus:ring-1 focus:ring-lion-gold/20 transition-all text-sm pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lion-gray-3 hover:text-lion-white transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gold-gradient text-lion-black font-bold text-sm tracking-wide hover:shadow-gold-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-lion-dark-4" />
          <span className="text-xs text-lion-gray-2">or</span>
          <div className="flex-1 h-px bg-lion-dark-4" />
        </div>

        <p className="text-center text-sm text-lion-gray-3">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-lion-gold hover:text-lion-gold-light font-semibold transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function SupabaseSignIn() {
  return (
    <Suspense fallback={null}>
      <SupabaseSignInInner />
    </Suspense>
  );
}

const SignInContent = isClientDemoMode ? DemoSignIn : SupabaseSignIn;

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lion-black px-4 -my-6">
      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-lion-gold/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-lion-gold/3 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gains-purple/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <SignInContent />
      </div>
    </div>
  );
}
