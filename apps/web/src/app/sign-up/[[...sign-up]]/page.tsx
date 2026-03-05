"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Ticket, Check, X } from "lucide-react";
import Link from "next/link";
import { isClientDemoMode } from "@/lib/env-client";
import { LionLogo } from "@/components/ui/lion-logo";

// ─── Shared header ───────────────────────────────────────────────────────────

function AuthHeader() {
  return (
    <div className="flex flex-col items-center gap-4 mb-10">
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

function DemoSignUp() {
  return (
    <div className="w-full max-w-sm">
      <AuthHeader />
      <div className="rounded-2xl bg-lion-dark-2 border border-lion-dark-4 p-8 space-y-5">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-lion-gold/10 border border-lion-gold/20 text-xs font-semibold text-lion-gold uppercase tracking-widest">
            Demo Mode
          </span>
          <h2 className="text-lg font-bold text-lion-white mt-3">Create your account</h2>
          <p className="text-sm text-lion-gray-3 leading-relaxed">
            Add your Supabase credentials to{" "}
            <code className="text-lion-gold bg-lion-dark-3 px-1.5 py-0.5 rounded text-xs">.env.local</code>{" "}
            to enable sign-up.
          </p>
        </div>

        <div className="space-y-3 opacity-40 pointer-events-none select-none">
          <div className="h-11 rounded-xl bg-lion-dark-3 border border-lion-dark-4" />
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

// ─── Real Supabase sign-up ────────────────────────────────────────────────────

type InviteStatus = "idle" | "checking" | "valid" | "invalid";

function SupabaseSignUpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inviteCode, setInviteCode] = useState("");
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("idle");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [debouncedCode, setDebouncedCode] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmation, setIsConfirmation] = useState(false);

  useEffect(() => {
    const code = searchParams.get("invite");
    if (code) setInviteCode(code.toUpperCase());
  }, [searchParams]);

  // Debounce the invite code
  useEffect(() => {
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setInviteStatus("idle");
      setInviteError(null);
      setDebouncedCode("");
      return;
    }
    setInviteStatus("checking");
    const timer = setTimeout(() => setDebouncedCode(code), 500);
    return () => clearTimeout(timer);
  }, [inviteCode]);

  // Validate when debounced code changes
  const checkInviteCode = useCallback(async (code: string) => {
    if (!code) return;
    setInviteStatus("checking");
    setInviteError(null);
    try {
      const res = await fetch(`/api/invite/validate?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.valid) {
        setInviteStatus("valid");
        setInviteError(null);
      } else {
        setInviteStatus("invalid");
        setInviteError(data.error ?? "Invalid invite code.");
      }
    } catch {
      setInviteStatus("invalid");
      setInviteError("Could not validate invite code.");
    }
  }, []);

  useEffect(() => {
    if (debouncedCode) checkInviteCode(debouncedCode);
  }, [debouncedCode, checkInviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      setError("An invite code is required to join Gains.");
      setIsLoading(false);
      return;
    }

    if (inviteStatus !== "valid") {
      setError(inviteError ?? "Please enter a valid invite code.");
      setIsLoading(false);
      return;
    }

    if (username.length < 3 || username.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      setIsLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores.");
      setIsLoading(false);
      return;
    }

    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase");
      const supabase = createSupabaseBrowserClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?invite=${encodeURIComponent(code)}`,
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

      if (authData.user && !authData.session) {
        setIsConfirmation(true);
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        await fetch("/api/auth/ensure-profile", { method: "POST" });
        await fetch("/api/invite/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
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
      <div className="w-full max-w-sm">
        <AuthHeader />
        <div className="rounded-2xl bg-lion-dark-2 border border-lion-dark-4 p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-lion-gold/10 border border-lion-gold/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">✉️</span>
          </div>
          <div className="space-y-2">
            <h2
              className="text-xl font-bold text-lion-white"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Check your email
            </h2>
            <p className="text-sm text-lion-gray-3 leading-relaxed">
              We sent a confirmation link to{" "}
              <span className="text-lion-gold font-medium">{email}</span>.
              Click the link to activate your account.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="inline-block w-full py-3 rounded-xl bg-gold-gradient text-lion-black font-bold text-sm text-center tracking-wide hover:shadow-gold-md transition-all duration-300"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = inviteStatus === "valid" && !isLoading;

  return (
    <div className="w-full max-w-sm">
      <AuthHeader />

      <div className="rounded-2xl bg-lion-dark-2 border border-lion-dark-4 p-8">
        <div className="text-center mb-8">
          <h2
            className="text-xl font-bold text-lion-white"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Create your account
          </h2>
          <p className="text-sm text-lion-gray-3 mt-1.5">
            Gains is invite-only. Enter your code to join.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invite code */}
          <div className="space-y-1.5">
            <label
              htmlFor="inviteCode"
              className="block text-xs font-semibold text-lion-gray-4 uppercase tracking-wider"
            >
              Invite Code
            </label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lion-gold" />
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                placeholder="YOURCODE"
                maxLength={20}
                className="w-full pl-9 pr-10 py-3 rounded-xl bg-lion-dark-3 border border-lion-gold/25 text-lion-gold placeholder:text-lion-gray-2 focus:outline-none focus:border-lion-gold/50 focus:ring-1 focus:ring-lion-gold/25 transition-all text-sm font-mono tracking-widest uppercase"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {inviteStatus === "checking" && (
                  <Loader2 className="w-4 h-4 text-lion-gray-3 animate-spin" />
                )}
                {inviteStatus === "valid" && (
                  <Check className="w-4 h-4 text-gains-green" />
                )}
                {inviteStatus === "invalid" && (
                  <X className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            {inviteStatus === "invalid" && inviteError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
                <X className="w-3 h-3 shrink-0" />
                {inviteError}
              </p>
            )}
            {inviteStatus === "valid" && (
              <p className="text-xs text-gains-green flex items-center gap-1.5 mt-1">
                <Check className="w-3 h-3 shrink-0" />
                Valid invite code
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-xs font-semibold text-lion-gray-4 uppercase tracking-wider"
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
              className="w-full px-4 py-3 rounded-xl bg-lion-dark-3 border border-lion-dark-4 text-lion-white placeholder:text-lion-gray-2 focus:outline-none focus:border-lion-gold/40 focus:ring-1 focus:ring-lion-gold/20 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-lion-gray-4 uppercase tracking-wider"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
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
                autoComplete="new-password"
                placeholder="At least 6 characters"
                minLength={6}
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
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl bg-gold-gradient text-lion-black font-bold text-sm tracking-wide hover:shadow-gold-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-lion-dark-4" />
          <span className="text-xs text-lion-gray-2">or</span>
          <div className="flex-1 h-px bg-lion-dark-4" />
        </div>

        <p className="text-center text-sm text-lion-gray-3">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-lion-gold hover:text-lion-gold-light font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function SupabaseSignUp() {
  return (
    <Suspense fallback={null}>
      <SupabaseSignUpInner />
    </Suspense>
  );
}

const SignUpContent = isClientDemoMode ? DemoSignUp : SupabaseSignUp;

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lion-black px-4 -my-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/2 translate-x-1/2 w-[500px] h-[500px] bg-lion-gold/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gains-purple/3 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gains-green/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full flex justify-center">
        <SignUpContent />
      </div>
    </div>
  );
}
