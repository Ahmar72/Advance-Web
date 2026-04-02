"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { supabase } from "@/lib/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";

interface AdminReviewAd {
  id: string;
  title: string;
  status: string;
  created_at: string;
  user_email: string;
}

type AdminReviewRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  users: { email: string } | { email: string }[] | null;
};

export default function AdminModerationPage() {
  const { user, role, loading } = useSupabaseAuth();
  const router = useRouter();
  const [ads, setAds] = useState<AdminReviewAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ADMIN_QUEUE_STATUSES = ["scheduled"] as const;

  useEffect(() => {
    if (!loading && (!user || (role !== "admin" && role !== "super_admin"))) {
      router.push("/signin");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (user && (role === "admin" || role === "super_admin")) {
      void fetchAds();
    }
  }, [user, role]);

  const fetchAds = useCallback(async () => {
    try {
      setLoadingAds(true);
      setError(null);

      const { data, error } = await supabase
        .from("ads")
        .select("id, title, status, created_at, users:user_id(email)")
        .in("status", ADMIN_QUEUE_STATUSES as unknown as string[])
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      const rows = (data || []) as unknown as AdminReviewRow[];
      const mapped: AdminReviewAd[] = rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        created_at: row.created_at,
        user_email: Array.isArray(row.users)
          ? (row.users[0]?.email ?? "")
          : (row.users?.email ?? ""),
      }));

      setAds(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin queue");
    } finally {
      setLoadingAds(false);
    }
  }, []);

  // Keep admin queue in sync when ads change status around the
  // admin moderation states.
  useEffect(() => {
    if (!user || (role !== "admin" && role !== "super_admin")) {
      return;
    }

    const channel = supabase
      .channel("admin-moderation-ads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ads" },
        (payload) => {
          const nextStatus = (payload.new as { status?: string }).status;
          if (
            nextStatus &&
            (ADMIN_QUEUE_STATUSES as readonly string[]).includes(nextStatus)
          ) {
            void fetchAds();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ads" },
        (payload) => {
          const nextStatus = (payload.new as { status?: string }).status;
          const prevStatus = (payload.old as { status?: string }).status;
          const wasInQueue =
            prevStatus &&
            (ADMIN_QUEUE_STATUSES as readonly string[]).includes(prevStatus);
          const nowInQueue =
            nextStatus &&
            (ADMIN_QUEUE_STATUSES as readonly string[]).includes(nextStatus);
          if (wasInQueue || nowInQueue) {
            void fetchAds();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "ads" },
        () => {
          void fetchAds();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, role, fetchAds]);

  const approve = async (adId: string) => {
    try {
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("Your session has expired. Please sign in again as admin.");
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        setError("Backend URL is not configured.");
        return;
      }

      const res = await fetch(`${backendUrl}/api/v1/admin/ads/${adId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "payment_pending" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          (body && (body.error || body.message)) ||
          `Backend error: ${res.status}`;
        setError(message);
        return;
      }

      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve ad");
    }
  };

  const reject = async (adId: string) => {
    const reason = prompt("Rejection reason (optional):") || "";
    try {
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("Your session has expired. Please sign in again as admin.");
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        setError("Backend URL is not configured.");
        return;
      }

      const res = await fetch(`${backendUrl}/api/v1/admin/ads/${adId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          (body && (body.error || body.message)) ||
          `Backend error: ${res.status}`;
        setError(message);
        return;
      }

      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject ad");
    }
  };

  const deleteAd = async (adId: string) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) {
      return;
    }

    try {
      const { error: logError } = await supabase.from("audit_logs").insert({
        actor_id: user?.id ?? null,
        action_type: "admin_delete_ad",
        target_type: "ad",
        target_id: adId,
      });

      if (logError) {
        console.error("Failed to log admin ad deletion", logError.message);
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("Your session has expired. Please sign in again as admin.");
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        setError("Backend URL is not configured.");
        return;
      }

      const res = await fetch(`${backendUrl}/api/v1/admin/ads/${adId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          (body && (body.error || body.message)) ||
          `Backend error: ${res.status}`;
        setError(message);
        return;
      }

      setAds((prev) => prev.filter((ad) => ad.id !== adId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete ad");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-base text-zinc-500">Loading admin moderation...</p>
      </div>
    );
  }

  return (
    <AdminShell
      title="Admin Moderation Queue"
      subtitle="Review ads accepted by moderators and enable payments"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
            {error}
          </div>
        ) : null}

        {loadingAds ? (
          <div className="text-center text-zinc-500 text-sm">
            Loading queue...
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-zinc-700 text-base">
              No ads waiting for admin approval
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              Moderators have not approved any new ads yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base md:text-lg font-semibold text-zinc-900">
                      {ad.title}
                    </h3>
                    <span className="text-[11px] bg-zinc-100 px-2 py-1 rounded-full text-zinc-700">
                      {ad.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Submitted by {ad.user_email || "unknown"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Created on {new Date(ad.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                  <Link
                    href={`/ads/${ad.id}`}
                    className="px-4 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-800 hover:bg-zinc-50 hover:border-blue-400 transition text-center text-sm font-medium"
                  >
                    View Ad
                  </Link>
                  <button
                    onClick={() => approve(ad.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                  >
                    ✓ Accept and enable payment
                  </button>
                  <button
                    onClick={() => reject(ad.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className="px-4 py-2 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-semibold shadow-sm transition"
                  >
                    Delete ad
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
