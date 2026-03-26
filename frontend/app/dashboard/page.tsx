'use client';

import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserAd {
  id: string;
  title: string;
  slug: string;
  status: string;
  package: { name: string };
  created_at: string;
  expire_at: string | null;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<UserAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchUserAds();
    }
  }, [user]);

  const fetchUserAds = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/admin/my-ads`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const { data } = await response.json();
        setAds(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoadingAds(false);
    }
  };

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-600',
    under_review: 'bg-yellow-600',
    payment_pending: 'bg-orange-600',
    payment_verified: 'bg-cyan-600',
    scheduled: 'bg-purple-600',
    published: 'bg-green-600',
    expired: 'bg-red-600',
    rejected: 'bg-pink-600',
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">My Listings</h1>
              <p className="text-slate-400">Manage your ads and track their status</p>
            </div>
            <Link
              href="/create-ad"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              + Post New Ad
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
            <p className="text-slate-400 text-sm">Total Ads</p>
            <p className="text-2xl font-bold text-white">{ads.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
            <p className="text-slate-400 text-sm">Published</p>
            <p className="text-2xl font-bold text-green-400">
              {ads.filter((a) => a.status === 'published').length}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
            <p className="text-slate-400 text-sm">Under Review</p>
            <p className="text-2xl font-bold text-yellow-400">
              {ads.filter((a) => a.status === 'under_review').length}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
            <p className="text-slate-400 text-sm">Drafts</p>
            <p className="text-2xl font-bold text-slate-400">
              {ads.filter((a) => a.status === 'draft').length}
            </p>
          </div>
        </div>

        {/* Ads Table */}
        {loadingAds ? (
          <div className="text-center text-slate-400 py-12">Loading your ads...</div>
        ) : ads.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 mb-4">You haven't posted any ads yet</p>
            <Link
              href="/create-ad"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              Post Your First Ad
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-slate-700 bg-slate-900/50">
                <tr>
                  <th className="text-left px-6 py-3 text-slate-200">Title</th>
                  <th className="text-left px-6 py-3 text-slate-200">Status</th>
                  <th className="text-left px-6 py-3 text-slate-200">Package</th>
                  <th className="text-left px-6 py-3 text-slate-200">Created</th>
                  <th className="text-left px-6 py-3 text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4">
                      <Link
                        href={`/ads/${ad.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {ad.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`${
                          statusColors[ad.status] || 'bg-slate-700'
                        } text-white text-xs font-bold px-3 py-1 rounded capitalize`}
                      >
                        {ad.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{ad.package.name}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {ad.status === 'draft' ? (
                        <Link
                          href={`/ads/${ad.id}/edit`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Edit
                        </Link>
                      ) : ad.status === 'payment_pending' ? (
                        <Link
                          href={`/ads/${ad.id}/payment`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Submit Payment
                        </Link>
                      ) : (
                        <span className="text-slate-500 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
