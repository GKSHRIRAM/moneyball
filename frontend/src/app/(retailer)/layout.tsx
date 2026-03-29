"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { useOnboardingStatus } from "@/hooks/useStore";

const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/retailer-deals", label: "Deals", icon: Tag },
  { href: "/retailer-reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function RetailerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { data: onboarding } = useOnboardingStatus();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== UserRole.retailer) {
        router.push("/deals");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Onboarding guard: redirect to /onboarding if not complete
  useEffect(() => {
    if (
      onboarding &&
      !onboarding.is_complete &&
      pathname !== "/onboarding"
    ) {
      router.push("/onboarding");
    }
  }, [onboarding, pathname, router]);

  // If already onboarded and visiting /onboarding, redirect to dashboard
  useEffect(() => {
    if (
      onboarding &&
      onboarding.is_complete &&
      pathname === "/onboarding"
    ) {
      router.push("/dashboard");
    }
  }, [onboarding, pathname, router]);

  if (isLoading || !isAuthenticated || user?.role !== UserRole.retailer) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* ── Sidebar (Desktop) ──────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[240px] lg:fixed lg:inset-y-0 bg-olive-dark text-white z-40">
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors">
              <span className="text-sm font-black text-white">D</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight block leading-none">
                DealDrop
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-medium">
                Retailer Suite
              </span>
            </div>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {SIDEBAR_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname?.startsWith(href + "/");

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user + logout + onboarding status */}
        <div className="px-3 pb-4 space-y-2">
          {onboarding?.is_complete && (
            <div className="flex items-center gap-2 px-3 py-2 text-green-400 text-xs font-medium">
              <CheckCircle size={14} />
              <span>Store setup complete</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
          <div className="px-3 py-3 rounded-lg bg-white/5">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || "Retailer"}
            </p>
            <p className="text-xs text-white/40 truncate">Partner Account</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ──────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-olive-dark h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-white" />
          )}
        </button>

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-xs font-black text-white">D</span>
          </div>
          <span className="text-base font-bold text-white">DealDrop</span>
        </Link>

        <button
          className="relative w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-white" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* ── Mobile Drawer ──────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-[260px] bg-olive-dark flex flex-col pt-16 animate-slide-in-left">
            <nav className="flex-1 px-3 py-4 space-y-1">
              {SIDEBAR_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname?.startsWith(href + "/");

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-white"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 pb-6 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-[240px] mt-14 lg:mt-0">{children}</main>
    </div>
  );
}
