"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase/client";

type PaymentRow = {
  id: string; // unique row id for React
  paymentId: string | null;
  hasPayment: boolean;
  ad: { id: string; title: string; slug: string; user_id: string };
  user: { id: string; email: string; full_name: string | null };
  amount: number;
  method: string;
  transaction_ref: string;
  sender_name: string;
  screenshot_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

type PaymentQueueQueryRow = {
  id: string;
  amount: number;
  method: string;
  transaction_ref: string;
  sender_name: string;
  screenshot_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  ad:
    | {
        id: string;
        title: string;
        slug: string;
        user_id: string;
        owner: { id: string; email: string; full_name: string | null } | null;
      }
    | {
        id: string;
        title: string;
        slug: string;
        user_id: string;
        owner: { id: string; email: string; full_name: string | null } | null;
      }[]
    | null;
};

type PaymentVerifyRow = {
  id: string;
  ad_id: string;
  package_id: string;
  package: { duration_days: number } | { duration_days: number }[] | null;
};

type PaymentRejectRow = {
  id: string;
  ad_id: string;
};

type PendingAdRow = {
  id: string;
  title: string;
  slug: string;
  user_id: string;
  created_at: string;
  owner:
    | { id: string; email: string; full_name: string | null }
    | { id: string; email: string; full_name: string | null }[]
    | null;
};

export default function PaymentQueuePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !isLoading &&
      (!user || (user.role !== "admin" && user.role !== "super_admin"))
    ) {
      router.push("/signin");
    }
  }, [user, isLoading, router]);

  const deleteAd = async (adId: string) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) {
      return;
    }

    try {
      const { error: logError } = await supabase.from("audit_logs").insert({
        actor_id: user?.id ?? "unknown",
        action_type: "admin_delete_ad",
        target_type: "ad",
        target_id: adId,
      });

      if (logError) {
        console.error("Failed to log admin ad deletion", logError.message);
      }

      const { error } = await supabase.from("ads").delete().eq("id", adId);

      if (error) {
        setError(error.message);
        return;
      }

      setPayments((prev) => prev.filter((p) => p.ad.id !== adId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete ad");
    }
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);

      const [paymentsRes, pendingAdsRes] = await Promise.all([
        supabase
          .from("payments")
          .select(
            "id, amount, method, transaction_ref, sender_name, screenshot_url, status, rejection_reason, created_at, ad:ads!inner(id, title, slug, user_id, owner:users(id, email, full_name))",
          )
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("ads")
          .select(
            "id, title, slug, user_id, created_at, owner:users(id, email, full_name)",
          )
          .eq("status", "payment_pending")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (paymentsRes.error) throw new Error(paymentsRes.error.message);
      if (pendingAdsRes.error) throw new Error(pendingAdsRes.error.message);

      const paymentRows = (paymentsRes.data || []) as unknown as PaymentQueueQueryRow[];
      const pendingAds = (pendingAdsRes.data || []) as unknown as PendingAdRow[];

      const byAdId = new Map<string, PaymentRow>();

      const mappedPayments: PaymentRow[] = paymentRows.map((row) => {
        const ad = Array.isArray(row.ad) ? row.ad[0] : row.ad;
        const paymentRow: PaymentRow = {
          id: row.id,
          paymentId: row.id,
          hasPayment: true,
          ad: {
            id: ad?.id || "",
            title: ad?.title || "Ad",
            slug: ad?.slug || "",
            user_id: ad?.user_id || "",
          },
          user: {
            id: ad?.owner?.id || ad?.user_id || "",
            email: ad?.owner?.email || "",
            full_name: ad?.owner?.full_name || null,
          },
          amount: Number(row.amount || 0),
          method: row.method,
          transaction_ref: row.transaction_ref,
          sender_name: row.sender_name,
          screenshot_url: row.screenshot_url,
          status: row.status,
          rejection_reason: row.rejection_reason,
          created_at: row.created_at,
        };
        if (paymentRow.ad.id) {
          byAdId.set(paymentRow.ad.id, paymentRow);
        }
        return paymentRow;
      });

      const mappedPendingAds: PaymentRow[] = pendingAds
        .filter((ad) => !byAdId.has(ad.id))
        .map((ad) => {
          const owner = Array.isArray(ad.owner) ? ad.owner[0] : ad.owner;
          return {
            id: `ad-${ad.id}`,
            paymentId: null,
            hasPayment: false,
            ad: {
              id: ad.id,
              title: ad.title || "Ad",
              slug: ad.slug || "",
              user_id: ad.user_id,
            },
            user: {
              id: owner?.id || ad.user_id,
              email: owner?.email || "",
              full_name: owner?.full_name || null,
            },
            amount: 0,
            method: "",
            transaction_ref: "",
            sender_name: "",
            screenshot_url: null,
            status: "payment_pending",
            rejection_reason: null,
            created_at: ad.created_at,
          };
        });

      setPayments([...mappedPayments, ...mappedPendingAds]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchQueue();
  }, [user]);

  const verify = async (paymentId: string, verified: boolean) => {
    try {
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("id, ad_id, package_id, package:packages(duration_days)")
        .eq("id", paymentId)
        .single();

      const typedPayment = paymentData as PaymentVerifyRow | null;

      if (paymentError || !typedPayment) {
        throw new Error(paymentError?.message || "Payment not found");
      }

      const nextStatus = verified ? "verified" : "rejected";

      const { error: updatePaymentError } = await supabase
        .from("payments")
        .update({ status: nextStatus, rejection_reason: null })
        .eq("id", paymentId);

      if (updatePaymentError) throw new Error(updatePaymentError.message);

      if (verified) {
        const now = new Date();
        const duration = Number(
          (Array.isArray(typedPayment.package)
            ? typedPayment.package[0]?.duration_days
            : typedPayment.package?.duration_days) || 0,
        );
        const expireAt = new Date(now);
        expireAt.setDate(expireAt.getDate() + duration);

        const { error: updateAdError } = await supabase
          .from("ads")
          .update({
            status: "published",
            publish_at: now.toISOString(),
            expire_at: expireAt.toISOString(),
          })
          .eq("id", typedPayment.ad_id);

        if (updateAdError) throw new Error(updateAdError.message);
      }

      // Remove verified/rejected item from the queue optimistically
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  };

  const reject = async (paymentId: string) => {
    const reason = prompt("Rejection reason (optional):") || "";
    try {
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("id, ad_id")
        .eq("id", paymentId)
        .single();

      const typedPayment = paymentData as PaymentRejectRow | null;

      if (paymentError || !typedPayment) {
        throw new Error(paymentError?.message || "Payment not found");
      }

      const { error: rejectPaymentError } = await supabase
        .from("payments")
        .update({ status: "rejected", rejection_reason: reason || null })
        .eq("id", paymentId);

      if (rejectPaymentError) throw new Error(rejectPaymentError.message);

      const { error: rejectAdError } = await supabase
        .from("ads")
        .update({ status: "rejected" })
        .eq("id", typedPayment.ad_id)
        .eq("status", "payment_pending");

      if (rejectAdError) throw new Error(rejectAdError.message);

      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-base text-zinc-500">Loading payment queue...</p>
      </div>
    );
  }

  return (
    <AdminShell
      title="Payment Verification Queue"
      subtitle="Review and verify offline payment proofs for ads"
    >
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-center text-zinc-500 text-sm">
            Loading queue...
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-zinc-700 text-base">No pending payments</p>
            <p className="text-zinc-500 text-sm mt-2">
              All payment proofs are currently verified or rejected, and no ads
              are waiting for payment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-zinc-900 font-semibold text-base md:text-lg">
                        {p.ad?.title || "Ad"}
                      </div>
                      <span className="text-[11px] bg-zinc-100 px-2 py-1 rounded-full text-zinc-700">
                        {p.status}
                      </span>
                    </div>

                    <div className="text-zinc-700 text-sm mt-2 space-y-1">
                      <div>
                        Amount:{" "}
                        <span className="text-zinc-900 font-semibold">
                          Rs {p.amount.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        Transaction:{" "}
                        <span className="text-zinc-900 font-semibold">
                          {p.transaction_ref}
                        </span>
                      </div>
                      <div>
                        Sender:{" "}
                        <span className="text-zinc-900 font-semibold">
                          {p.sender_name}
                        </span>
                      </div>
                      <div>
                        Proof:{" "}
                        <span className="text-zinc-900 font-semibold">
                          {p.method}
                        </span>
                      </div>
                      {p.rejection_reason ? (
                        <div className="text-red-600 text-sm">
                          Rejection reason: {p.rejection_reason}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                    <Link
                      href={`/ads/${p.ad.id}`}
                      className="px-4 py-2 bg-white border border-zinc-300 rounded-lg text-zinc-800 hover:bg-zinc-50 hover:border-blue-400 transition text-center text-sm font-medium"
                    >
                      View Ad
                    </Link>
                    {p.hasPayment ? (
                      <>
                        <button
                          onClick={() => verify(p.paymentId as string, true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                        >
                          ✓ Verify & Publish
                        </button>
                        <button
                          onClick={() => reject(p.paymentId as string)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                        >
                          ✗ Reject Payment
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-zinc-500">
                        Waiting for client to submit payment proof.
                      </p>
                    )}
                    <button
                      onClick={() => deleteAd(p.ad.id)}
                      className="px-4 py-2 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-semibold shadow-sm transition"
                    >
                      Delete ad
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
