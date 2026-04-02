"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { supabase } from "@/lib/supabase/client";
import { formatIsoDate } from "@/lib/utils/date";
import { AD_STATUS_COLORS } from "@/lib/utils/ad-status";

type HistoryAd = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  expire_at: string | null;
  moderation_remark: string | null;
  package_name: string | null;
};

type HistoryAdRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  expire_at: string | null;
  moderation_remark: string | null;
  package: { name: string } | { name: string }[] | null;
};

export default function DashboardHistoryPage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [ads, setAds] = useState<HistoryAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("ads")
          .select(
            "id, title, status, created_at, expire_at, moderation_remark, package:packages(name)",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to load history ads:", error.message);
          return;
        }

        const rows = (data || []) as unknown as HistoryAdRow[];
        const mapped: HistoryAd[] = rows.map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          created_at: row.created_at,
          expire_at: row.expire_at,
          moderation_remark: row.moderation_remark,
          package_name: Array.isArray(row.package)
            ? (row.package[0]?.name ?? null)
            : (row.package?.name ?? null),
        }));

        setAds(mapped);
      } finally {
        setLoadingAds(false);
      }
    };

    void load();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-slate-950">
        <p className="text-sm text-zinc-500">Loading your history...</p>
      </div>
    );
  }

  const ongoing = ads.filter((ad) =>
    ["draft", "under_review", "payment_pending", "payment_submitted"].includes(
      ad.status,
    ),
  );
  const completed = ads.filter((ad) =>
    ["published", "expired", "rejected", "archived"].includes(ad.status),
  );

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-10 w-full space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Activity history
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            See all your ads across statuses 
            (draft, ongoing, paid, published, and rejected).
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="neon-card bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Total Ads</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{ads.length}</p>
          </div>
          <div className="neon-card bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Published</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {ads.filter((a) => a.status === "published").length}
            </p>
          </div>
          <div className="neon-card bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Rejected</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">
              {ads.filter((a) => a.status === "rejected").length}
            </p>
          </div>
          <div className="neon-card bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Paid / Verified</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {ads.filter((a) => a.status === "payment_verified").length}
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Ongoing ads
          </h2>
          {loadingAds ? (
            <p className="text-sm text-zinc-500">Loading ongoing ads...</p>
          ) : ongoing.length === 0 ? (
            <p className="text-sm text-zinc-500">No ongoing ads right now.</p>
          ) : (
            <div className="neon-card bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Title
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Package
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {ongoing.map((ad) => (
                    <tr key={ad.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-2">
                        <p className="font-medium text-zinc-900 truncate">
                          {ad.title}
                        </p>
                        {ad.moderation_remark ? (
                          <p className="mt-1 text-[11px] text-amber-700">
                            Moderator: {ad.moderation_remark}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`${
                            AD_STATUS_COLORS[ad.status] || "bg-slate-700"
                          } text-white text-[11px] font-semibold px-3 py-1 rounded-full capitalize`}
                        >
                          {ad.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-600">
                        {ad.package_name ?? "-"}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {formatIsoDate(ad.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Completed & past ads
          </h2>
          {loadingAds ? (
            <p className="text-sm text-zinc-500">Loading past ads...</p>
          ) : completed.length === 0 ? (
            <p className="text-sm text-zinc-500">
              You don&apos;t have any past ads yet.
            </p>
          ) : (
            <div className="neon-card bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Title
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Package
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Created
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Ended
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {completed.map((ad) => (
                    <tr key={ad.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-2">
                        <p className="font-medium text-zinc-900 truncate">
                          {ad.title}
                        </p>
                        {ad.moderation_remark ? (
                          <p className="mt-1 text-[11px] text-amber-700">
                            Moderator: {ad.moderation_remark}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`${
                            AD_STATUS_COLORS[ad.status] || "bg-slate-700"
                          } text-white text-[11px] font-semibold px-3 py-1 rounded-full capitalize`}
                        >
                          {ad.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-600">
                        {ad.package_name ?? "-"}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {formatIsoDate(ad.created_at)}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        {ad.expire_at ? formatIsoDate(ad.expire_at) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
