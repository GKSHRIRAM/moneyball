"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  CalendarCheck,
  PiggyBank,
  User,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/deals", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/reservations", label: "Orders", icon: CalendarCheck },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== UserRole.consumer) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== UserRole.consumer) {
    return null; // Don't flash layout while redirecting
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/deals" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-sm font-black text-white">D</span>
            </div>
            <span className="text-lg font-bold text-charcoal tracking-tight hidden sm:block">
              DealDrop
            </span>
          </Link>

          {/* User & Notifications */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-charcoal hidden sm:block">
              Welcome, {user?.name || "Guest"}
            </span>
            <button
              className="relative w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-charcoal" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="flex-1 pb-20 sm:pb-24">{children}</main>

      {/* ── Bottom Navigation ────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 safe-area-bottom">
        <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname?.startsWith(href + "/");
            const isProfile = href === "/profile";

            return (
              <Link
                key={href}
                href={isProfile ? "#" : href}
                onClick={
                  isProfile
                    ? async (e) => {
                        e.preventDefault();
                        await logout();
                        router.push("/login");
                      }
                    : undefined
                }
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]",
                  isActive
                    ? "text-primary"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    isActive && "font-semibold"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
