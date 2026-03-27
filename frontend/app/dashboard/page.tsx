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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this draft ad?');
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to delete ad');
        return;
      }

      setAds((prev) => prev.filter((ad) => ad.id !== id));
    } catch (error) {
      console.error('Failed to delete ad:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-base text-zinc-500">Loading your dashboard...</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-zinc-500',
    under_review: 'bg-amber-500',
    payment_pending: 'bg-orange-500',
    payment_verified: 'bg-cyan-600',
    scheduled: 'bg-violet-500',
    published: 'bg-emerald-600',
    expired: 'bg-rose-500',
    rejected: 'bg-pink-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">My Listings</h1>
              <p className="text-sm text-zinc-500">Manage your ads and track their status</p>
            </div>
            <div className="flex items-center gap-3">
              {(user.role === 'moderator' || user.role === 'admin' || user.role === 'super_admin') && (
                <Link
                  href="/moderator/queue"
                  className="text-xs md:text-sm px-3 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 transition"
                >
                  Moderator Queue
                </Link>
              )}
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <Link
                  href="/admin/dashboard"
                  className="text-xs md:text-sm px-3 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 transition"
                >
                  Admin Dashboard
                </Link>
              )}
              <Link
                href="/create-ad"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 md:px-6 py-2.5 rounded-lg text-sm md:text-base font-semibold shadow-sm transition"
              >
                + Post New Ad
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Total Ads</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{ads.length}</p>
          </div>
          <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Published</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {ads.filter((a) => a.status === 'published').length}
            </p>
          </div>
          <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Under Review</p>
            <p className="mt-1 text-2xl font-bold text-amber-500">
              {ads.filter((a) => a.status === 'under_review').length}
            </p>
          </div>
          <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Drafts</p>
            <p className="mt-1 text-2xl font-bold text-zinc-600">
              {ads.filter((a) => a.status === 'draft').length}
            </p>
          </div>
        </div>

        {/* Ads Table */}
        {loadingAds ? (
          <div className="text-center text-zinc-500 py-12 text-sm">Loading your ads...</div>
        ) : ads.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center shadow-sm">
            <p className="text-sm text-zinc-600 mb-4">You haven't posted any ads yet</p>
            <Link
              href="/create-ad"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
            >
              Post Your First Ad
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50/80">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Package</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Created</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-zinc-50 transition">
                    <td className="px-6 py-4">
                      <Link
                        href={`/ads/${ad.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {ad.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`${
                          statusColors[ad.status] || 'bg-slate-700'
                        } text-white text-[11px] font-semibold px-3 py-1 rounded-full capitalize`}
                      >
                        {ad.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">{ad.package.name}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {ad.status === 'draft' ? (
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/ads/${ad.id}/edit`}
                            className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(ad.id)}
                            disabled={deletingId === ad.id}
                            className="text-xs md:text-sm font-medium text-rose-500 hover:text-rose-600 disabled:opacity-50"
                          >
                            {deletingId === ad.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      ) : ad.status === 'payment_pending' ? (
                        <Link
                          href={`/ads/${ad.id}/payment`}
                          className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Submit Payment
                        </Link>
                      ) : (
                        <span className="text-zinc-400 text-sm">—</span>
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
