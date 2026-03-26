'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      !isLoading &&
      (!user || (user.role !== 'admin' && user.role !== 'super_admin'))
    ) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-400">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">Platform metrics and performance</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Listings Summary</h2>
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
          <h2 className="text-2xl font-bold text-white mb-4">Revenue</h2>
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
          <h2 className="text-2xl font-bold text-white mb-4">Moderation</h2>
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
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Categories</h3>
            <div className="space-y-2">
              {analytics.taxonomy.top_categories.map((cat, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-slate-400">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${
                            (cat.count /
                              Math.max(
                                ...analytics.taxonomy.top_categories.map(
                                  (c) => c.count
                                )
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold w-8 text-right">
                      {cat.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Cities</h3>
            <div className="space-y-2">
              {analytics.taxonomy.top_cities.map((city, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-slate-400">{city.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${
                            (city.count /
                              Math.max(
                                ...analytics.taxonomy.top_cities.map(
                                  (c) => c.count
                                )
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold w-8 text-right">
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
          <h2 className="text-2xl font-bold text-white mb-4">Package Distribution</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ads by Package</h3>
              <div className="space-y-2">
                {analytics.packages.distribution.map((pkg, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-slate-400">{pkg.name}</span>
                    <span className="text-white font-semibold">{pkg.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Revenue by Package</h3>
              <div className="space-y-2">
                {analytics.packages.revenue_by_package.map((pkg, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-slate-400">{pkg.name}</span>
                    <span className="text-white font-semibold">
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
          <h2 className="text-2xl font-bold text-white mb-4">User Statistics</h2>
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
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'blue',
  icon,
}: {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'slate';
  icon?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30',
    green: 'bg-green-500/10 border-green-500/30',
    red: 'bg-red-500/10 border-red-500/30',
    yellow: 'bg-yellow-500/10 border-yellow-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
    slate: 'bg-slate-500/10 border-slate-500/30',
  };

  return (
    <div
      className={`${colorClasses[color]} border rounded-lg p-4`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}
