"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

interface DashboardMetrics {
  total_ads: number;
  active_ads: number;
  total_revenue: number;
  rejected_ads: number;
}

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "admin" && user.role !== "super_admin"))) {
      router.push("/signin");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
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
      {loading ? (
        <div className="text-center text-zinc-500 text-sm">Loading...</div>
      ) : (
        <>
          {metrics && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-1">Total Ads</p>
                <p className="text-3xl font-bold text-zinc-900">{metrics.total_ads}</p>
              </div>
              <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-1">Active Listings</p>
                <p className="text-3xl font-bold text-emerald-600">{metrics.active_ads}</p>
              </div>
              <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${metrics.total_revenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-1">Rejected Ads</p>
                <p className="text-3xl font-bold text-rose-500">{metrics.rejected_ads}</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/admin/payment-queue"
              className="block bg-white border border-zinc-200 p-6 rounded-2xl hover:bg-zinc-50 shadow-sm transition"
            >
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Payment Queue</h3>
              <p className="text-sm text-zinc-600">Verify pending payment proofs</p>
              <span className="text-sm font-semibold text-blue-600 mt-4 inline-block">
                View Queue 
                
              </span>
            </Link>

            <Link
              href="/moderator/queue"
              className="block bg-white border border-zinc-200 p-6 rounded-2xl hover:bg-zinc-50 shadow-sm transition"
            >
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Content Review</h3>
              <p className="text-sm text-zinc-600">Review ads under moderation</p>
              <span className="text-sm font-semibold text-blue-600 mt-4 inline-block">
                Review Queue 
                
              </span>
            </Link>

            <Link
              href="/admin/analytics"
              className="block bg-white border border-zinc-200 p-6 rounded-2xl hover:bg-zinc-50 shadow-sm transition"
            >
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Analytics</h3>
              <p className="text-sm text-zinc-600">View detailed platform analytics</p>
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
