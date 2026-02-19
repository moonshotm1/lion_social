"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, Bell, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/create", label: "Create", icon: PlusSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile/me", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-lion-dark-1/95 backdrop-blur-xl border-t border-lion-gold/10">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                transition-all duration-200
                ${
                  isActive
                    ? "text-lion-gold"
                    : "text-lion-gray-3 active:text-lion-white"
                }
              `}
            >
              {/* Active glow dot */}
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 rounded-full bg-lion-gold shadow-gold-sm" />
              )}

              {/* Create button special styling */}
              {item.label === "Create" ? (
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-gold-gradient shadow-gold-md"
                        : "bg-lion-dark-3 border border-lion-gold/20"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-lion-black" : "text-lion-gold"
                    }`}
                  />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {/* Notification badge */}
                    {item.label === "Notifications" && (
                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-lion-gold text-lion-black text-[8px] font-bold flex items-center justify-center">
                        3
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
