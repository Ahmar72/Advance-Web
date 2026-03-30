"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase/client";

interface AnalyticsData {
  summary: {
    total_ads: number;
    published_ads: number;
    pending_ads: number;
    rejected_ads: number;
    expired_ads: number;
  };
  revenue: {
    total_revenue: number;
    verified_payments: number;
    pending_payments: number;
    rejected_payments: number;
    average_order_value: number;
  };
  moderation: {
    total_reviewed: number;
    approval_rate: number;
    rejection_rate: number;
    average_review_time: string;
  };
  taxonomy: {
    top_categories: Array<{ name: string; count: number }>;
    top_cities: Array<{ name: string; count: number }>;
  };
  packages: {
    distribution: Array<{ name: string; count: number }>;
    revenue_by_package: Array<{ name: string; revenue: number }>;
  };
  users: {
    total_users: number;
    active_users: number;
    verified_sellers: number;
  };
}

type AdAnalyticsRow = {
  id: string;
  status: string;
  category_id: string | null;
  city_id: string | null;
  package_id: string | null;
  user_id: string;
  created_at: string;
};

type PaymentAnalyticsRow = {
  id: string;
  amount: number;
  status: string;
  package_id: string | null;
  created_at: string;
};

type CategoryRow = { id: string; name: string };
type CityRow = { id: string; name: string };
type PackageRow = { id: string; name: string };
type UserAnalyticsRow = {
  id: string;
  is_verified_seller: boolean | null;
  last_sign_in_at: string | null;
  created_at: string;
};

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      !isLoading &&
      (!user || (user.role !== "admin" && user.role !== "super_admin"))
    ) {
      router.push("/signin");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const [
        adsQuery,
        paymentsQuery,
        categoriesQuery,
        citiesQuery,
        packagesQuery,
        usersQuery,
      ] = await Promise.all([
        supabase
          .from("ads")
          .select(
            "id, status, category_id, city_id, package_id, user_id, created_at",
          ),
        supabase
          .from("payments")
          .select("id, amount, status, package_id, created_at"),
        supabase.from("categories").select("id, name"),
        supabase.from("cities").select("id, name"),
        supabase.from("packages").select("id, name"),
        supabase
          .from("users")
          .select("id, is_verified_seller, last_sign_in_at, created_at"),
      ]);

      if (adsQuery.error) throw new Error(adsQuery.error.message);
      if (paymentsQuery.error) throw new Error(paymentsQuery.error.message);
      if (categoriesQuery.error) throw new Error(categoriesQuery.error.message);
      if (citiesQuery.error) throw new Error(citiesQuery.error.message);
      if (packagesQuery.error) throw new Error(packagesQuery.error.message);
      if (usersQuery.error) throw new Error(usersQuery.error.message);

      const ads = (adsQuery.data || []) as AdAnalyticsRow[];
      const payments = (paymentsQuery.data || []) as PaymentAnalyticsRow[];
      const categories = (categoriesQuery.data || []) as CategoryRow[];
      const cities = (citiesQuery.data || []) as CityRow[];
      const packages = (packagesQuery.data || []) as PackageRow[];
      const users = (usersQuery.data || []) as UserAnalyticsRow[];

      const countByStatus = (status: string) =>
        ads.filter((ad) => ad.status === status).length;

      const verifiedPayments = payments.filter((p) => p.status === "verified");
      const pendingPayments = payments.filter((p) => p.status === "pending");
      const rejectedPayments = payments.filter((p) => p.status === "rejected");
      const totalRevenue = verifiedPayments.reduce(
        (sum: number, p) => sum + Number(p.amount || 0),
        0,
      );

      const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
      const cityNameById = new Map(cities.map((c) => [c.id, c.name]));
      const packageNameById = new Map(packages.map((p) => [p.id, p.name]));

      const categoryCounts = new Map<string, number>();
      const cityCounts = new Map<string, number>();
      const packageCounts = new Map<string, number>();
      const revenueByPackage = new Map<string, number>();

      ads.forEach((ad) => {
        if (ad.category_id) {
          categoryCounts.set(
            ad.category_id,
            (categoryCounts.get(ad.category_id) || 0) + 1,
          );
        }
        if (ad.city_id) {
          cityCounts.set(ad.city_id, (cityCounts.get(ad.city_id) || 0) + 1);
        }
        if (ad.package_id) {
          packageCounts.set(
            ad.package_id,
            (packageCounts.get(ad.package_id) || 0) + 1,
          );
        }
      });

      verifiedPayments.forEach((p) => {
        if (!p.package_id) return;
        revenueByPackage.set(
          p.package_id,
          (revenueByPackage.get(p.package_id) || 0) + Number(p.amount || 0),
        );
      });

      const toTopRows = (
        countMap: Map<string, number>,
        nameMap: Map<string, string>,
      ) =>
        Array.from(countMap.entries())
          .map(([id, count]) => ({ name: nameMap.get(id) || "Unknown", count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUserIds = new Set<string>();

      users.forEach((u) => {
        const lastSignIn = u.last_sign_in_at
          ? new Date(u.last_sign_in_at)
          : null;
        if (lastSignIn && lastSignIn >= thirtyDaysAgo) {
          activeUserIds.add(u.id);
        }
      });

      ads.forEach((ad) => {
        const createdAt = ad.created_at ? new Date(ad.created_at) : null;
        if (createdAt && createdAt >= thirtyDaysAgo) {
          activeUserIds.add(ad.user_id);
        }
      });

      const reviewed = countByStatus("published") + countByStatus("rejected");
      const approvalRate = reviewed
        ? (countByStatus("published") / reviewed) * 100
        : 0;
      const rejectionRate = reviewed
        ? (countByStatus("rejected") / reviewed) * 100
        : 0;

      setAnalytics({
        summary: {
          total_ads: ads.length,
          published_ads: countByStatus("published"),
          pending_ads:
            countByStatus("under_review") +
            countByStatus("scheduled") +
            countByStatus("payment_pending"),
          rejected_ads: countByStatus("rejected"),
          expired_ads: countByStatus("expired"),
        },
        revenue: {
          total_revenue: totalRevenue,
          verified_payments: verifiedPayments.length,
          pending_payments: pendingPayments.length,
          rejected_payments: rejectedPayments.length,
          average_order_value:
            verifiedPayments.length > 0
              ? totalRevenue / verifiedPayments.length
              : 0,
        },
        moderation: {
          total_reviewed: reviewed,
          approval_rate: approvalRate,
          rejection_rate: rejectionRate,
          average_review_time: "N/A",
        },
        taxonomy: {
          top_categories: toTopRows(categoryCounts, categoryNameById),
          top_cities: toTopRows(cityCounts, cityNameById),
        },
        packages: {
          distribution: toTopRows(packageCounts, packageNameById),
          revenue_by_package: Array.from(revenueByPackage.entries())
            .map(([id, revenue]) => ({
              name: packageNameById.get(id) || "Unknown",
              revenue,
            }))
            .sort((a, b) => b.revenue - a.revenue),
        },
        users: {
          total_users: users.length,
          active_users: activeUserIds.size,
          verified_sellers: users.filter((u) => Boolean(u.is_verified_seller))
            .length,
        },
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading analytics...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <AdminShell title="Analytics" subtitle="Platform metrics and performance">
        <div className="text-sm text-zinc-500">Loading analytics...</div>
      </AdminShell>
    );
  }

  if (!analytics) {
    return (
      <AdminShell title="Analytics" subtitle="Platform metrics and performance">
        <div className="text-sm text-red-600">Failed to load analytics.</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Analytics" subtitle="Platform metrics and performance">
      <div className="space-y-8">
        {/* Summary Cards */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Listings Summary
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            <StatCard
              label="Total Ads"
              value={analytics.summary.total_ads}
              color="blue"
            />
            <StatCard
              label="Published"
              value={analytics.summary.published_ads}
              color="green"
              icon="✓"
            />
            <StatCard
              label="Pending Review"
              value={analytics.summary.pending_ads}
              color="yellow"
              icon="⏱"
            />
            <StatCard
              label="Rejected"
              value={analytics.summary.rejected_ads}
              color="red"
              icon="✕"
            />
            <StatCard
              label="Expired"
              value={analytics.summary.expired_ads}
              color="slate"
              icon="◯"
            />
          </div>
        </div>

        {/* Revenue Section */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Revenue</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <StatCard
              label="Total Revenue"
              value={`Rs ${analytics.revenue.total_revenue.toFixed(0)}`}
              color="green"
            />
            <StatCard
              label="Verified Payments"
              value={analytics.revenue.verified_payments}
              color="green"
              icon="✓"
            />
            <StatCard
              label="Pending"
              value={analytics.revenue.pending_payments}
              color="yellow"
              icon="⏱"
            />
            <StatCard
              label="Rejected"
              value={analytics.revenue.rejected_payments}
              color="red"
              icon="✕"
            />
            <StatCard
              label="Avg Order Value"
              value={`Rs ${analytics.revenue.average_order_value.toFixed(0)}`}
              color="blue"
            />
          </div>
        </div>

        {/* Moderation Stats */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Moderation</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              label="Total Reviewed"
              value={analytics.moderation.total_reviewed}
              color="blue"
            />
            <StatCard
              label="Approval Rate"
              value={`${analytics.moderation.approval_rate.toFixed(1)}%`}
              color="green"
            />
            <StatCard
              label="Rejection Rate"
              value={`${analytics.moderation.rejection_rate.toFixed(1)}%`}
              color="red"
            />
            <StatCard
              label="Avg Review Time"
              value={analytics.moderation.average_review_time}
              color="blue"
            />
          </div>
        </div>

        {/* Top Categories and Cities */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Categories */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              Top Categories
            </h3>
            <div className="space-y-2">
              {analytics.taxonomy.top_categories.map((cat, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-zinc-600">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${
                            (cat.count /
                              Math.max(
                                ...analytics.taxonomy.top_categories.map(
                                  (c) => c.count,
                                ),
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-zinc-900 font-semibold w-8 text-right">
                      {cat.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              Top Cities
            </h3>
            <div className="space-y-2">
              {analytics.taxonomy.top_cities.map((city, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-zinc-600">{city.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${
                            (city.count /
                              Math.max(
                                ...analytics.taxonomy.top_cities.map(
                                  (c) => c.count,
                                ),
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-zinc-900 font-semibold w-8 text-right">
                      {city.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Package Distribution */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            Package Distribution
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                Ads by Package
              </h3>
              <div className="space-y-2">
                {analytics.packages.distribution.map((pkg, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-zinc-600">{pkg.name}</span>
                    <span className="text-zinc-900 font-semibold">
                      {pkg.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                Revenue by Package
              </h3>
              <div className="space-y-2">
                {analytics.packages.revenue_by_package.map((pkg, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-zinc-600">{pkg.name}</span>
                    <span className="text-zinc-900 font-semibold">
                      Rs {pkg.revenue.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">
            User Statistics
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard
              label="Total Users"
              value={analytics.users.total_users}
              color="blue"
            />
            <StatCard
              label="Active Users"
              value={analytics.users.active_users}
              color="green"
            />
            <StatCard
              label="Verified Sellers"
              value={analytics.users.verified_sellers}
              color="purple"
              icon="✓"
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  color = "blue",
  icon,
}: {
  label: string;
  value: string | number;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "slate";
  icon?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-emerald-50 border-emerald-200",
    red: "bg-red-50 border-red-200",
    yellow: "bg-amber-50 border-amber-200",
    purple: "bg-purple-50 border-purple-200",
    slate: "bg-zinc-50 border-zinc-200",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4 shadow-sm`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-zinc-500 text-sm">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{value}</p>
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}
