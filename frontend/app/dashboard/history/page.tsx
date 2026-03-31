"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";

export default function DashboardHistoryPage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-slate-950">
        <p className="text-sm text-zinc-500">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-10 w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Activity history
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          This page will show your past ads, status changes, and payments in a future update.
        </p>
        <div className="neon-card border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-slate-900/70 p-6 text-sm text-zinc-600 dark:text-zinc-300">
          For now, you can review your current listings on the main dashboard and see their statuses.
        </div>
      </div>
    </div>
  );
}
