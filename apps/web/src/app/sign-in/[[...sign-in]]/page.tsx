"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Crown, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { isClientDemoMode } from "@/lib/env-client";

function DemoSignIn() {
  return (
    <div className="relative z-10 w-full max-w-sm">
      <div className="rounded-xl bg-lion-dark-1 border border-lion-gold/10 shadow-dark-lg p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-lion-white">Demo Mode</h2>
        <p className="text-sm text-lion-gray-3 leading-relaxed">
          Sign in is not available in demo mode. Add your Supabase keys to{" "}
          <code className="text-lion-gold">.env.local</code> to enable
          authentication.
        </p>
        <Link
          href="/"
          className="inline-block btn-gold px-6 py-2.5 text-sm font-semibold rounded-xl"
        >
          Back to Feed
        </Link>
      </div>
    </div>
  );
}

function SupabaseSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to") || "/";

  const [email, setEmail] = useState("");
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

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-sm">
      <div className="rounded-xl bg-lion-dark-1 border border-lion-gold/10 shadow-dark-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-lion-white">Welcome back</h2>
          <p className="text-sm text-lion-gray-3 mt-1">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-lion-gray-4 mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-lion-dark-2 border border-lion-gold/10 text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/30 focus:ring-1 focus:ring-lion-gold/20 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-lion-gray-4 mb-1.5"
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
                className="w-full px-4 py-2.5 rounded-xl bg-lion-dark-2 border border-lion-gold/10 text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/30 focus:ring-1 focus:ring-lion-gold/20 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lion-gray-3 hover:text-lion-white transition-colors"
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
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gold-gradient hover:shadow-gold-md text-lion-black font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-lion-gold/10" />
          <span className="text-xs text-lion-gray-3">or</span>
          <div className="flex-1 h-px bg-lion-gold/10" />
        </div>

        <p className="text-center text-sm text-lion-gray-3">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-lion-gold hover:text-lion-gold-light font-medium transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

const SignInContent = isClientDemoMode ? DemoSignIn : SupabaseSignIn;

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lion-black px-4 -my-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lion-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lion-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold-lg">
          <Crown className="w-8 h-8 text-lion-black" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-wider text-gold-gradient">
            GAINS
          </h1>
          <p className="text-sm text-lion-gray-3 mt-1">
            Welcome back, champion
          </p>
        </div>
      </div>

      <SignInContent />
    </div>
  );
}
