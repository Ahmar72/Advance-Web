"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ReviewItem {
  id: string;
  title: string;
  description: string;
  status: string;
  user: { email: string };
  media: Array<{ original_url: string }>;
}

export default function ModeratorQueuePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (
      !isLoading &&
      (!user ||
        (user.role !== "moderator" && user.role !== "admin" && user.role !== "super_admin"))
    ) {
      router.push("/signin");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchQueue();
    }
  }, [user]);

  const fetchQueue = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/moderator?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        setQueue(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/moderator/${adId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            approved: true,
            internal_note: notes[adId] || undefined,
          }),
        }
      );

      if (response.ok) {
        setQueue(queue.filter((item) => item.id !== adId));
      }
    } catch (error) {
      console.error("Failed to approve ad:", error);
    }
  };

  const handleReject = async (adId: string) => {
    const reason = prompt(
      "Rejection reason (required, minimum 10 characters):"
    )
      ?.trim()
      .toString() || "";

    if (reason.length < 10) {
      alert("Reason must be at least 10 characters.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/moderator/${adId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            approved: false,
            rejection_reason: reason,
            internal_note: notes[adId] || undefined,
          }),
        }
      );

      if (response.ok) {
        setQueue(queue.filter((item) => item.id !== adId));
      }
    } catch (error) {
      console.error("Failed to reject ad:", error);
    }
  };

  const handleFlag = async (adId: string) => {
    // PDF requires moderators to be able to flag suspicious media/content.
    const reason = prompt("Flag reason (min 10 chars):") || "";
    if (reason.trim().length < 10) {
      alert('Reason must be at least 10 characters.');
      return;
    }
    const severityInput = prompt("Severity (low | medium | high):", "medium") || "medium";
    const severity = severityInput.toLowerCase();
    if (severity !== 'low' && severity !== 'medium' && severity !== 'high') {
      alert('Invalid severity. Use: low, medium, or high.');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/moderator/${adId}/flag`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ reason, severity }),
        }
      );

      if (!response.ok) throw new Error(`Flag failed: ${response.status}`);
      alert("Content flagged.");
    } catch (e) {
      console.error("Failed to flag content:", e);
      alert("Failed to flag content.");
    }
  };

  if (isLoading || !user) {
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
        {loading ? (
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
                    <p className="text-xs text-zinc-500">Submitted by: {item.user.email}</p>
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
