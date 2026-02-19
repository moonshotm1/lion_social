"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { isClientDemoMode } from "@/lib/env-client";

function DemoSignIn() {
  return (
    <div className="relative z-10 w-full max-w-sm">
      <div className="rounded-xl bg-lion-dark-1 border border-lion-gold/10 shadow-dark-lg p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-lion-white">Demo Mode</h2>
        <p className="text-sm text-lion-gray-3 leading-relaxed">
          Sign in is not available in demo mode. Add your Clerk API keys to{" "}
          <code className="text-lion-gold">.env.local</code> to enable authentication.
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

function ClerkSignIn() {
  const { SignIn } = require("@clerk/nextjs");

  return (
    <div className="relative z-10">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-lion-dark-1 border border-lion-gold/10 shadow-dark-lg",
            headerTitle: "text-lion-white",
            headerSubtitle: "text-lion-gray-3",
            socialButtonsBlockButton:
              "bg-lion-dark-2 border-lion-gold/10 text-lion-white hover:bg-lion-dark-3",
            formFieldLabel: "text-lion-gray-4",
            formFieldInput:
              "bg-lion-dark-2 border-lion-gold/10 text-lion-white",
            formButtonPrimary:
              "bg-gold-gradient hover:shadow-gold-md text-lion-black font-semibold",
            footerActionLink: "text-lion-gold hover:text-lion-gold-light",
            dividerLine: "bg-lion-gold/10",
            dividerText: "text-lion-gray-3",
          },
        }}
      />
    </div>
  );
}

const SignInContent = isClientDemoMode ? DemoSignIn : ClerkSignIn;

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lion-black px-4 -my-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lion-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lion-gold/3 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
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
