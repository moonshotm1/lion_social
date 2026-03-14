"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface SettingRow {
  icon: React.ElementType;
  label: string;
  description: string;
  href?: string;
  danger?: boolean;
}

const accountRows: SettingRow[] = [
  {
    icon: User,
    label: "Edit Profile",
    description: "Update your name, bio, and avatar",
    href: "/profile/edit",
  },
  {
    icon: Lock,
    label: "Change Password",
    description: "Reset your password via email",
    href: "/forgot-password",
  },
];

const appRows: SettingRow[] = [
  {
    icon: Bell,
    label: "Notifications",
    description: "Manage your notification preferences",
    href: "/notifications",
  },
  {
    icon: Shield,
    label: "Privacy",
    description: "Control who can see your content",
    href: undefined, // coming soon
  },
];

function SettingItem({ row }: { row: SettingRow }) {
  const Icon = row.icon;
  const inner = (
    <div
      className={`flex items-center gap-4 px-5 py-4 transition-colors duration-200 ${
        row.href
          ? "hover:bg-lion-dark-3/60 cursor-pointer"
          : "opacity-50 cursor-not-allowed"
      } ${row.danger ? "hover:bg-red-400/5" : ""}`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          row.danger
            ? "bg-red-400/10 text-red-400"
            : "bg-lion-dark-3 text-lion-gold"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${
            row.danger ? "text-red-400" : "text-lion-white"
          }`}
        >
          {row.label}
        </p>
        <p className="text-xs text-lion-gray-3 mt-0.5">{row.description}</p>
      </div>
      {row.href && (
        <ChevronRight className="w-4 h-4 text-lion-gray-2 shrink-0" />
      )}
      {!row.href && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-lion-dark-3 text-lion-gray-2 uppercase tracking-wider shrink-0">
          Soon
        </span>
      )}
    </div>
  );

  if (!row.href) return <div>{inner}</div>;
  return <Link href={row.href}>{inner}</Link>;
}

export default function SettingsPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <div className="max-w-lg mx-auto pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1
          className="text-xl font-bold text-lion-white"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Settings
        </h1>
      </div>

      <div className="space-y-6">
        {/* Account */}
        <section>
          <p className="text-xs font-semibold text-lion-gray-3 uppercase tracking-wider px-1 mb-2">
            Account
          </p>
          <div className="rounded-2xl bg-lion-dark-2 border border-lion-dark-4 overflow-hidden divide-y divide-lion-dark-4">
            {accountRows.map((row) => (
              <SettingItem key={row.label} row={row} />
            ))}
          </div>
        </section>

        {/* App */}
        <section>
          <p className="text-xs font-semibold text-lion-gray-3 uppercase tracking-wider px-1 mb-2">
            App
          </p>
          <div className="rounded-2xl bg-lion-dark-2 border border-lion-dark-4 overflow-hidden divide-y divide-lion-dark-4">
            {appRows.map((row) => (
              <SettingItem key={row.label} row={row} />
            ))}
          </div>
        </section>

        {/* Sign out */}
        <section>
          <div className="rounded-2xl bg-lion-dark-2 border border-lion-dark-4 overflow-hidden">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-400/5 transition-colors duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-red-400/10 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-red-400">Sign Out</p>
                <p className="text-xs text-lion-gray-3 mt-0.5">
                  Sign out of your account
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* App version */}
        <p className="text-center text-xs text-lion-gray-2 pt-2">
          GAINS · Members only
        </p>
      </div>
    </div>
  );
}
