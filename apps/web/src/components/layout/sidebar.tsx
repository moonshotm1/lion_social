"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/create", label: "Create", icon: PlusSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile/me", label: "Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

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

        <button className="flex items-center gap-4 px-4 py-3 rounded-xl text-lion-gray-3 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 w-full">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>

      {/* User card */}
      <div className="p-4 m-3 rounded-xl bg-lion-dark-2 border border-lion-gold/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center text-lion-black font-bold text-sm">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-lion-white truncate">
              You
            </p>
            <p className="text-xs text-lion-gray-3 truncate">@your_handle</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
