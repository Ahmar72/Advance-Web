'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Platform metrics and management</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : (
          <>
            {/* Key Metrics */}
            {metrics && (
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg">
                  <p className="text-slate-400 text-sm mb-2">Total Ads</p>
                  <p className="text-4xl font-bold text-white">{metrics.total_ads}</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg">
                  <p className="text-slate-400 text-sm mb-2">Active Listings</p>
                  <p className="text-4xl font-bold text-green-400">{metrics.active_ads}</p>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg">
                  <p className="text-slate-400 text-sm mb-2">Total Revenue</p>
                  <p className="text-4xl font-bold text-blue-400">
                    ${metrics.total_revenue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg">
                  <p className="text-slate-400 text-sm mb-2">Rejected Ads</p>
                  <p className="text-4xl font-bold text-red-400">{metrics.rejected_ads}</p>
                </div>
              </div>
            )}

            {/* Action Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/admin/payment-queue"
                className="block bg-slate-800 border border-slate-700 p-6 rounded-lg hover:bg-slate-700 transition"
              >
                <h3 className="text-xl font-semibold text-white mb-2">Payment Queue</h3>
                <p className="text-slate-400">Verify pending payment proofs</p>
                <span className="text-blue-400 mt-4 inline-block">View Queue →</span>
              </Link>

              <Link
                href="/moderator/queue"
                className="block bg-slate-800 border border-slate-700 p-6 rounded-lg hover:bg-slate-700 transition"
              >
                <h3 className="text-xl font-semibold text-white mb-2">Content Review</h3>
                <p className="text-slate-400">Review ads under moderation</p>
                <span className="text-blue-400 mt-4 inline-block">Review Queue →</span>
              </Link>

              <Link
                href="/admin/analytics"
                className="block bg-slate-800 border border-slate-700 p-6 rounded-lg hover:bg-slate-700 transition"
              >
                <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
                <p className="text-slate-400">View detailed platform analytics</p>
                <span className="text-blue-400 mt-4 inline-block">View Analytics →</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
