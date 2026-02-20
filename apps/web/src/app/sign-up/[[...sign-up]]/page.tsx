"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { isClientDemoMode } from "@/lib/env-client";

function DemoSignUp() {
  return (
    <div className="relative z-10 w-full max-w-sm">
      <div className="rounded-xl bg-lion-dark-1 border border-lion-gold/10 shadow-dark-lg p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-lion-white">Demo Mode</h2>
        <p className="text-sm text-lion-gray-3 leading-relaxed">
          Sign up is not available in demo mode. Add your Supabase keys to{" "}
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

function SupabaseSignUp() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmation, setIsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (username.length < 3 || username.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      setIsLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError(
        "Username can only contain letters, numbers, and underscores."
      );
      setIsLoading(false);
      return;
    }

    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase");
      const supabase = createSupabaseBrowserClient();

      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (authData.user && authData.user.identities?.length === 0) {
        setError("An account with this email already exists.");
        setIsLoading(false);
        return;
      }

      // Email confirmation required — show confirmation screen
      if (authData.user && !authData.session) {
        setIsConfirmation(true);
        setIsLoading(false);
        return;
      }

      // No email confirmation — create user profile immediately
      if (authData.user) {
        await fetch("/api/trpc/user.create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            json: {
              supabaseId: authData.user.id,
              username,
            },
          }),
        });
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isConfirmation) {
    return (
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-xl bg-lion-dark-1 border border-lion-gold/10 shadow-dark-lg p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-lion-gold/10 flex items-center justify-center mx-auto">
            <Crown className="w-6 h-6 text-lion-gold" />
          </div>
          <h2 className="text-lg font-bold text-lion-white">
            Check your email
          </h2>
          <p className="text-sm text-lion-gray-3 leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="text-lion-gold">{email}</span>. Click the link
            to activate your account.
          </p>
          <Link
            href="/sign-in"
            className="inline-block btn-gold px-6 py-2.5 text-sm font-semibold rounded-xl"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-sm">
      <div className="rounded-xl bg-lion-dark-1 border border-lion-gold/10 shadow-dark-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-lion-white">
            Create your account
          </h2>
          <p className="text-sm text-lion-gray-3 mt-1">
            Join the community and start your journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-lion-gray-4 mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="your_username"
              minLength={3}
              maxLength={30}
              className="w-full px-4 py-2.5 rounded-xl bg-lion-dark-2 border border-lion-gold/10 text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/30 focus:ring-1 focus:ring-lion-gold/20 transition-colors"
            />
          </div>

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
                autoComplete="new-password"
                placeholder="At least 6 characters"
                minLength={6}
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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-lion-gold/10" />
          <span className="text-xs text-lion-gray-3">or</span>
          <div className="flex-1 h-px bg-lion-gold/10" />
        </div>

        <p className="text-center text-sm text-lion-gray-3">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-lion-gold hover:text-lion-gold-light font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const SignUpContent = isClientDemoMode ? DemoSignUp : SupabaseSignUp;

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lion-black px-4 -my-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-lion-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-lion-gold/3 rounded-full blur-3xl" />
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
            Join the community. Elevate your life.
          </p>
        </div>
      </div>

      <SignUpContent />
    </div>
  );
}
