"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { LionLogo } from "@/components/ui/lion-logo";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  // Supabase sends the reset token as a hash fragment which it exchanges for a
  // real session automatically. We just wait for the session to be present.
  useEffect(() => {
    let cancelled = false;

    async function waitForSession() {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase");
      const supabase = createSupabaseBrowserClient();

      // Give Supabase a moment to process the hash token
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session) {
        setSessionReady(true);
        return;
      }

      // Listen for the PASSWORD_RECOVERY event which fires after token exchange
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
        if (cancelled) return;
        if (event === "PASSWORD_RECOVERY" || (sess && !sessionReady)) {
          setSessionReady(true);
          subscription.unsubscribe();
        }
      });

      // Timeout after 5s — token may be invalid or expired
      setTimeout(() => {
        if (cancelled || sessionReady) return;
        setSessionError(true);
      }, 5000);

      return () => { cancelled = true; subscription.unsubscribe(); };
    }

    waitForSession();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase");
      const supabase = createSupabaseBrowserClient();

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/sign-in"), 2500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lion-black px-4 -my-6">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-lion-gold/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
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

        <div className="rounded-2xl bg-lion-dark-2 border border-lion-dark-4 p-8">
          {success ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-gains-green/10 border border-gains-green/20 flex items-center justify-center mx-auto">
                <span className="text-2xl">✅</span>
              </div>
              <div className="space-y-2">
                <h2
                  className="text-xl font-bold text-lion-white"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  Password updated!
                </h2>
                <p className="text-sm text-lion-gray-3 leading-relaxed">
                  Redirecting you to sign in…
                </p>
              </div>
            </div>
          ) : sessionError ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="space-y-2">
                <h2
                  className="text-xl font-bold text-lion-white"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  Link expired or invalid
                </h2>
                <p className="text-sm text-lion-gray-3 leading-relaxed">
                  This reset link has expired or already been used. Request a new one.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="inline-block w-full py-3 rounded-xl bg-gold-gradient text-lion-black font-bold text-sm text-center tracking-wide hover:shadow-gold-md transition-all duration-300"
              >
                Request New Link
              </Link>
            </div>
          ) : !sessionReady ? (
            <div className="text-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-lion-gold mx-auto" />
              <p className="text-sm text-lion-gray-3">Verifying reset link…</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2
                  className="text-xl font-bold text-lion-white"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  Set new password
                </h2>
                <p className="text-sm text-lion-gray-3 mt-1.5">
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-lion-gray-4 uppercase tracking-wider"
                  >
                    New Password
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
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="confirm"
                    className="block text-xs font-semibold text-lion-gray-4 uppercase tracking-wider"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      minLength={6}
                      className="w-full px-4 py-3 rounded-xl bg-lion-dark-3 border border-lion-dark-4 text-lion-white placeholder:text-lion-gray-2 focus:outline-none focus:border-lion-gold/40 focus:ring-1 focus:ring-lion-gold/20 transition-all text-sm pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lion-gray-3 hover:text-lion-white transition-colors p-1"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      Updating…
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
