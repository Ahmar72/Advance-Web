"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { supabase } from "@/lib/supabase/client";

interface DashboardMetrics {
  total_ads: number;
  active_ads: number;
  total_revenue: number;
  rejected_ads: number;
}

type PaymentMetricRow = {
  amount: number | null;
  status: string;
};

export default function AdminDashboardPage() {
  const { user, role, loading } = useSupabaseAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (role !== "admin" && role !== "super_admin"))) {
      router.push("/signin");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (user && (role === "admin" || role === "super_admin")) {
      void fetchMetrics();
    }
  }, [user, role]);

  const fetchMetrics = async () => {
    try {
      const [
        { count: totalAds },
        { count: activeAds },
        paymentsRes,
        { count: rejectedAds },
      ] = await Promise.all([
        supabase.from("ads").select("id", { count: "exact", head: true }),
        supabase
          .from("ads")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
        supabase.from("payments").select("amount, status"),
        supabase
          .from("ads")
          .select("id", { count: "exact", head: true })
          .eq("status", "rejected"),
      ]);

      let totalRevenue = 0;
      if (!paymentsRes.error && paymentsRes.data) {
        const paymentRows = paymentsRes.data as PaymentMetricRow[];
        totalRevenue = paymentRows
          .filter((p) => p.status === "verified")
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      }

      setMetrics({
        total_ads: totalAds ?? 0,
        active_ads: activeAds ?? 0,
        total_revenue: totalRevenue,
        rejected_ads: rejectedAds ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch metrics from Supabase:", error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-base text-zinc-500">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle="Platform metrics, payments, moderation, and analytics"
    >
      {loadingMetrics ? (
        <div className="text-center text-zinc-500 text-sm">Loading...</div>
      ) : (
        <>
          {metrics && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-1">
                  Total Ads
                </p>
                <p className="text-3xl font-bold text-zinc-900">
                  {metrics.total_ads}
                </p>
              </div>
              <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-1">
                  Active Listings
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {metrics.active_ads}
                </p>
              </div>
              <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  ${metrics.total_revenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-1">
                  Rejected Ads
                </p>
                <p className="text-3xl font-bold text-rose-500">
                  {metrics.rejected_ads}
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/admin/payment-queue"
              className="block bg-white border border-zinc-200 p-6 rounded-2xl hover:bg-zinc-50 shadow-sm transition"
            >
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                Payment Queue
              </h3>
              <p className="text-sm text-zinc-600">
                Verify pending payment proofs
              </p>
              <span className="text-sm font-semibold text-blue-600 mt-4 inline-block">
                View Queue
              </span>
            </Link>

            <Link
              href="/admin/moderation"
              className="block bg-white border border-zinc-200 p-6 rounded-2xl hover:bg-zinc-50 shadow-sm transition"
            >
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                Admin Approvals
              </h3>
              <p className="text-sm text-zinc-600">
                Accept or reject ads approved by moderators
              </p>
              <span className="text-sm font-semibold text-blue-600 mt-4 inline-block">
                Review Admin Queue
              </span>
            </Link>

            <Link
              href="/admin/analytics"
              className="block bg-white border border-zinc-200 p-6 rounded-2xl hover:bg-zinc-50 shadow-sm transition"
            >
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                Analytics
              </h3>
              <p className="text-sm text-zinc-600">
                View detailed platform analytics
              </p>
              <span className="text-sm font-semibold text-blue-600 mt-4 inline-block">
                View Analytics
              </span>
            </Link>
          </div>
        </>
      )}
    </AdminShell>
  );
}
