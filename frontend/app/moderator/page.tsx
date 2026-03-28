"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { supabase } from "@/lib/supabase/client";
import { formatIsoDate } from "@/lib/utils/date";

type ModeratorAdRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  moderation_remark: string | null;
  user_id: string;
};

type QueueUserRow = {
  id: string;
  email: string | null;
};

type ModeratorAd = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  moderation_remark: string | null;
  user_email: string;
};

const QUEUE_STATUSES = ["under_review", "payment_pending"];

export default function ModeratorDashboardPage() {
  const { user, role, loading, signOut } = useSupabaseAuth();
  const router = useRouter();

  const [items, setItems] = useState<ModeratorAd[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    if (role !== "moderator" && role !== "admin" && role !== "super_admin") {
      router.push("/dashboard");
    }
  }, [loading, role, router, user]);

  useEffect(() => {
    const fetchModerationData = async () => {
      if (!user) return;

      try {
        setError(null);

        const { data, error: adsError } = await supabase
          .from("ads")
          .select("id, title, status, created_at, moderation_remark, user_id")
          .in("status", QUEUE_STATUSES)
          .order("created_at", { ascending: false })
          .limit(100);

        if (adsError) {
          setError(`Failed to load moderation dashboard: ${adsError.message}`);
          return;
        }

        const rows = (data || []) as unknown as ModeratorAdRow[];

        if (rows.length === 0) {
          setItems([]);
          return;
        }

        const userIds = Array.from(new Set(rows.map((row) => row.user_id)));

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email")
          .in("id", userIds);

        if (usersError) {
          setError(`Failed to load submitter data: ${usersError.message}`);
        }

        const usersRows = (usersData || []) as unknown as QueueUserRow[];
        const userEmailById = new Map(
          usersRows.map((u) => [u.id, u.email || ""]),
        );

        const mapped: ModeratorAd[] = rows.map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          created_at: row.created_at,
          moderation_remark: row.moderation_remark,
          user_email: userEmailById.get(row.user_id) || "Unknown",
        }));

        setItems(mapped);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load moderation dashboard.",
        );
      } finally {
        setLoadingItems(false);
      }
    };

    if (
      user &&
      (role === "moderator" || role === "admin" || role === "super_admin")
    ) {
      void fetchModerationData();
    }
  }, [role, user]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      underReview: items.filter((i) => i.status === "under_review").length,
      paymentPending: items.filter((i) => i.status === "payment_pending")
        .length,
    };
  }, [items]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-base text-zinc-500">
          Loading moderator dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100 flex">
      <aside className="hidden md:flex md:flex-col w-64 border-r border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-5 border-b border-zinc-200">
          <h1 className="text-lg font-semibold text-zinc-900">
            Moderator Panel
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review and process listing requests
          </p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto text-sm">
          <Link
            href="/moderator"
            className="w-full flex items-center rounded-lg px-3 py-2 font-medium text-zinc-900 bg-zinc-100"
          >
            Dashboard
          </Link>
          <Link
            href="/moderator/queue"
            className="w-full flex items-center rounded-lg px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100 transition"
          >
            Review Queue
          </Link>
          <Link
            href="/dashboard"
            className="w-full flex items-center rounded-lg px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100 transition"
          >
            User Listings
          </Link>
          <Link
            href="/settings"
            className="w-full flex items-center rounded-lg px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100 transition"
          >
            Account Settings
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">
                Moderator Dashboard
              </h2>
              <p className="text-sm text-zinc-500">
                View and process incoming moderation items
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/moderator/queue"
                className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Open Queue
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl w-full mx-auto px-4 py-8 space-y-6">
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
              <p className="text-xs font-medium text-zinc-500">Queue Total</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">
                {counts.total}
              </p>
            </div>
            <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
              <p className="text-xs font-medium text-zinc-500">Under Review</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {counts.underReview}
              </p>
            </div>
            <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
              <p className="text-xs font-medium text-zinc-500">
                Payment Pending
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {counts.paymentPending}
              </p>
            </div>
          </div>

          {loadingItems ? (
            <div className="text-center text-zinc-500 py-10">
              Loading moderation data...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center shadow-sm">
              <p className="text-sm text-zinc-600">
                No moderation items right now.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="border-b border-zinc-200 bg-zinc-50/80">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                        Title
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                        Submitter
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                        Created
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50 transition">
                        <td className="px-6 py-4">
                          <Link
                            href={`/ads/${item.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            {item.title}
                          </Link>
                          {item.moderation_remark ? (
                            <p className="mt-1 text-xs text-amber-700">
                              Remark: {item.moderation_remark}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-700 capitalize">
                          {item.status.replace(/_/g, " ")}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {item.user_email}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {formatIsoDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href="/moderator/queue"
                            className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm"
                  >
                    <Link
                      href={`/ads/${item.id}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-2 text-xs text-zinc-600 capitalize">
                      Status: {item.status.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Submitter: {item.user_email}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Created: {formatIsoDate(item.created_at)}
                    </p>
                    {item.moderation_remark ? (
                      <p className="mt-1 text-xs text-amber-700">
                        Remark: {item.moderation_remark}
                      </p>
                    ) : null}
                    <Link
                      href="/moderator/queue"
                      className="mt-3 inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Review Item
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
