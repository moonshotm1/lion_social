"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Compass,
  PlusSquare,
  Bell,
  User,
  Crown,
  LogOut,
  Settings,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

const staticNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/create", label: "Create", icon: PlusSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useCurrentUser();
  const profileHref = user ? `/profile/${user.username}` : "/profile/me";
  const navItems = [
    ...staticNavItems,
    { href: profileHref, label: "Profile", icon: User },
  ];

  const handleSignOut = async () => {
    const { createSupabaseBrowserClient } = await import("@/lib/supabase");
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-lion-dark-1 border-r border-lion-gold/10 z-50">
      {/* Logo */}
      <div className="p-6 pb-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold-md group-hover:shadow-gold-lg transition-shadow duration-300">
            <Crown className="w-5 h-5 text-lion-black" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-gold-gradient">
              GAINS
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-lion-gray-3 uppercase">
              Wellness Social
            </p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-6 my-4 h-px bg-gradient-to-r from-transparent via-lion-gold/20 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-4 px-4 py-3 rounded-xl
                    transition-all duration-200 group relative
                    ${
                      isActive
                        ? "bg-lion-gold/10 text-lion-gold"
                        : "text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3"
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold-gradient rounded-r-full" />
                  )}

                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive
                        ? "text-lion-gold"
                        : "text-lion-gray-3 group-hover:text-lion-white"
                    }`}
                  />

                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-lion-gold" : ""
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Notification badge */}
                  {item.label === "Notifications" && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-lion-gold text-lion-black text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Divider */}
      <div className="mx-6 my-2 h-px bg-gradient-to-r from-transparent via-lion-gold/20 to-transparent" />

      {/* Bottom section */}
      <div className="p-3 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </Link>

        <button onClick={handleSignOut} className="flex items-center gap-4 px-4 py-3 rounded-xl text-lion-gray-3 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 w-full">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>

      {/* User card */}
      {user && (
        <Link href={profileHref} className="block p-4 m-3 rounded-xl bg-lion-dark-2 border border-lion-gold/10 hover:border-lion-gold/20 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-lion-gold/20 shrink-0">
              <Image
                src={user.avatar}
                alt={user.displayName}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-lion-white truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-lion-gray-3 truncate">@{user.username}</p>
            </div>
          </div>
        </Link>
      )}
    </aside>
  );
}
