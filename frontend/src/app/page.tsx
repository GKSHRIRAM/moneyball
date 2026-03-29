"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import { UserRole } from "@/types/auth";

export default function RootPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Rely on useAuth's built-in hydration from useEffect, just handle navigation here
    if (!isLoading) {
      if (isAuthenticated && user) {
        if (user.role === UserRole.retailer) {
          router.push("/dashboard");
        } else {
          router.push("/deals");
        }
      } else {
        router.push("/login");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // While checking auth, show a branded spinner screen
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-black italic tracking-tighter shadow-sm p-4 bg-charcoal rounded-xl">
          <span className="text-white">Deal</span>
          <span className="text-primary">Drop</span>
        </h1>
        <Spinner size="lg" className="text-primary" />
        <p className="text-charcoal font-medium animate-pulse">Loading experience...</p>
      </div>
    </div>
  );
}
