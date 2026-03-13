"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { LionLogo } from "@/components/ui/lion-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase");
      const supabase = createSupabaseBrowserClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
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
          {sent ? (
            <div className="text-center space-y-5">
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
                  We sent a password reset link to{" "}
                  <span className="text-lion-gold font-medium">{email}</span>.
                  Click the link to set a new password.
                </p>
              </div>
              <Link
                href="/sign-in"
                className="inline-block w-full py-3 rounded-xl bg-gold-gradient text-lion-black font-bold text-sm text-center tracking-wide hover:shadow-gold-md transition-all duration-300"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2
                  className="text-xl font-bold text-lion-white"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  Reset your password
                </h2>
                <p className="text-sm text-lion-gray-3 mt-1.5">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      Sending…
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <Link
                  href="/sign-in"
                  className="text-sm text-lion-gold hover:text-lion-gold-light font-medium transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
