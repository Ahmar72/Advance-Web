"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface UserAd {
  id: string;
  title: string;
  slug: string;
  status: string;
  package_name: string | null;
  created_at: string;
  expire_at: string | null;
}

export default function DashboardPage() {
  const { user, role, loading, signOut } = useSupabaseAuth();
  const { user: contextUser, signOut: contextSignOut } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<UserAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    const currentRole = (user.user_metadata?.role as string) || role || "client";

    if (currentRole === "admin" || currentRole === "super_admin") {
      router.push("/admin/dashboard");
      return;
    }

    if (currentRole === "moderator") {
      router.push("/moderator/queue");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (user) {
      void fetchUserAds();
    }
  }, [user]);

  const fetchUserAds = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("ads")
        .select(
          `id, title, slug, status, created_at, expire_at, package:packages(name)`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch ads from Supabase:", error.message);
        return;
      }

      const mapped: UserAd[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        status: row.status,
        package_name: row.package?.name ?? null,
        created_at: row.created_at,
        expire_at: row.expire_at,
      }));

      setAds(mapped);
    } catch (error) {
      console.error("Failed to fetch ads:", error);
    } finally {
      setLoadingAds(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this draft ad?"
    );
    if (!confirmDelete || !user) return;

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("status", "draft");

      if (error) {
        console.error("Failed to delete ad", error.message);
        return;
      }

      setAds((prev) => prev.filter((ad) => ad.id !== id));
    } catch (error) {
      console.error("Failed to delete ad:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
  const moderatorEmail = process.env.NEXT_PUBLIC_MODERATOR_EMAIL?.toLowerCase();

  const handleLogout = async () => {
    try {
      await signOut();
      await contextSignOut();
      router.push("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading || !user) {
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-5 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
              {(contextUser?.full_name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 truncate">
                {contextUser?.full_name || user.email}
              </div>
              <div className="text-xs text-zinc-500 capitalize">{role || "client"}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto text-sm">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center rounded-lg px-3 py-2 font-medium text-zinc-900 bg-zinc-100"
          >
            My Listings
          </button>
          <button
            type="button"
            onClick={() => router.push("/create-ad")}
            className="w-full flex items-center rounded-lg px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100 transition"
          >
            Post New Ad
          </button>
          <button
            type="button"
            onClick={() => router.push("/settings")}
            className="w-full flex items-center rounded-lg px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100 transition"
          >
            Account Settings
          </button>
        </nav>
        <div className="px-4 py-3 border-t border-zinc-200">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">My Listings</h1>
              <p className="text-sm text-zinc-500">Manage your ads and track their status</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/create-ad"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 md:px-6 py-2.5 rounded-lg text-sm md:text-base font-semibold shadow-sm transition"
              >
                + Post New Ad
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {accessError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
              {accessError}
            </div>
          )}
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
                    <td className="px-6 py-4 text-sm text-zinc-600">{ad.package_name ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {ad.status === "draft" ? (
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
                      ) : ad.status === "payment_pending" ? (
                        <Link
                          href={`/packages?adId=${ad.id}`}
                          className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          You can pay for your plan
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
    </div>
  );
}
