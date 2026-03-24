"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { LionLogo } from "@/components/ui/lion-logo";

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-lion-black">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-lion-gold/20 blur-xl scale-110" />
          <LionLogo size={72} withBackground className="relative rounded-2xl shadow-gold-lg" />
        </div>

        {/* Success icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-lion-gold/10 border border-lion-gold/30 flex items-center justify-center">
            <BadgeCheck className="w-8 h-8 text-lion-gold" />
          </div>
          <h1 className="text-2xl font-bold text-lion-white">
            Verification successful!
          </h1>
          <p className="text-sm text-lion-gray-3 leading-relaxed">
            Your email has been confirmed. You&apos;re all set — welcome to the community.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="w-full py-3 rounded-xl text-sm font-bold text-lion-black bg-gold-gradient text-center transition-opacity hover:opacity-90 active:scale-95"
        >
          Enter the app
        </Link>
      </div>
    </div>
  );
}
