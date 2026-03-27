"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { supabase } from "@/lib/supabaseClient";

interface ReviewItem {
  id: string;
  title: string;
  description: string;
  status: string;
  user_email: string;
  media: Array<{ original_url: string }>;
}

export default function ModeratorQueuePage() {
  const { user, role, loading } = useSupabaseAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (
      !loading &&
      (!user ||
        (role !== "moderator" && role !== "admin" && role !== "super_admin"))
    ) {
      router.push("/signin");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (user && (role === "moderator" || role === "admin" || role === "super_admin")) {
      void fetchQueue();
    }
  }, [user, role]);

  const fetchQueue = async () => {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select(
          `id, title, description, status, users:user_id(email), ad_media:ad_media(original_url)`
        )
        .eq("status", "under_review")
        .limit(50);

      if (error) {
        console.error("Failed to fetch moderation queue from Supabase", error.message);
        return;
      }

      const mapped: ReviewItem[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        user_email: row.users?.email ?? "",
        media: row.ad_media || [],
      }));

      setQueue(mapped);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleApprove = async (adId: string) => {
    try {
      const { error } = await supabase
        .from("ads")
        .update({ status: "scheduled" })
        .eq("id", adId)
        .eq("status", "under_review");

      if (error) {
        console.error("Failed to approve ad:", error.message);
        return;
      }

      setQueue((prev) => prev.filter((item) => item.id !== adId));
    } catch (error) {
      console.error("Failed to approve ad:", error);
    }
  };

  const handleReject = async (adId: string) => {
    const reason =
      prompt("Rejection reason (required, minimum 10 characters):")
        ?.trim()
        .toString() || "";

    if (reason.length < 10) {
      alert("Reason must be at least 10 characters.");
      return;
    }

    try {
      const { error } = await supabase
        .from("ads")
        .update({ status: "rejected" })
        .eq("id", adId)
        .eq("status", "under_review");

      if (error) {
        console.error("Failed to reject ad:", error.message);
        return;
      }

      setQueue((prev) => prev.filter((item) => item.id !== adId));
    } catch (error) {
      console.error("Failed to reject ad:", error);
    }
  };

  const handleFlag = async (adId: string) => {
    const reason = prompt("Flag reason (min 10 chars):") || "";
    if (reason.trim().length < 10) {
      alert("Reason must be at least 10 characters.");
      return;
    }
    const severityInput = prompt("Severity (low | medium | high):", "medium") || "medium";
    const severity = severityInput.toLowerCase();
    if (severity !== "low" && severity !== "medium" && severity !== "high") {
      alert("Invalid severity. Use: low, medium, or high.");
      return;
    }

    try {
      const { error } = await supabase.from("audit_logs").insert({
        action_type: "moderator_flag",
        target_type: "ad",
        target_id: adId,
        note: `${severity.toUpperCase()}: ${reason}`,
      });

      if (error) {
        console.error("Failed to flag content:", error.message);
        alert("Failed to flag content.");
        return;
      }

      alert("Content flagged.");
    } catch (e) {
      console.error("Failed to flag content:", e);
      alert("Failed to flag content.");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-base text-zinc-500">Loading moderation queue...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Moderation Panel</h1>
          <p className="text-sm text-zinc-500">
            Review ads for content quality, policy fit, and suspicious media.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loadingQueue ? (
          <div className="text-center text-zinc-500 text-sm">Loading queue...</div>
        ) : queue.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-zinc-700 text-base">No ads to review</p>
            <p className="text-zinc-500 text-sm mt-1">All pending ads have been reviewed!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {queue.map((item) => (
              <div key={item.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Preview & media */}
                  <div className="space-y-3">
                    <div className="h-40 bg-zinc-100 rounded-xl mb-2 overflow-hidden flex items-center justify-center text-xs text-zinc-400">
                      {item.media && item.media.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.media[0].original_url}
                          alt="Ad media preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>No media uploaded</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">Submitted by: {item.user_email}</p>
                    <p className="text-[11px] text-zinc-500">
                      Check for misleading information, inappropriate content, and spam.
                    </p>
                  </div>

                  {/* Content & policy fit */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-zinc-600 mb-2 line-clamp-4">{item.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="bg-zinc-100 rounded-full px-3 py-1 text-[11px] text-zinc-700">
                        Status: {item.status}
                      </span>
                      <span className="bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-[11px] text-amber-800">
                        Policy fit
                      </span>
                      <span className="bg-sky-50 border border-sky-200 rounded-full px-3 py-1 text-[11px] text-sky-800">
                        Content quality
                      </span>
                    </div>
                  </div>

                  {/* Internal notes & actions */}
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-600">
                        Internal notes (visible to team only)
                      </label>
                      <textarea
                        value={notes[item.id] || ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        placeholder="Add brief context for other moderators (optional)"
                      />
                    </div>

                    <button
                      onClick={() => handleApprove(item.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold shadow-sm transition"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold transition"
                    >
                      ✗ Reject with reason
                    </button>
                    <button
                      onClick={() => handleFlag(item.id)}
                      className="bg-white hover:bg-zinc-50 text-zinc-800 py-2.5 rounded-lg text-sm font-semibold border border-zinc-300 shadow-sm transition"
                    >
                      🚩 Flag suspicious media
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
