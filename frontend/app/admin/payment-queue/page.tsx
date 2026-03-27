"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabaseClient";

type PaymentRow = {
  id: string;
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

export default function PaymentQueuePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !isLoading &&
      (!user || (user.role !== 'admin' && user.role !== 'super_admin'))
    ) {
      router.push('/signin');
    }
  }, [user, isLoading, router]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("Failed to load queue: missing access token");
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/payments?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Failed to load queue: ${res.status}`);

      const json = await res.json();
      setPayments((json.data?.data as PaymentRow[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchQueue();
  }, [user]);

  const verify = async (paymentId: string, verified: boolean) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("Action failed: missing access token");
      }

      const body = { verified };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/payments/${paymentId}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error(`Verify failed: ${res.status}`);

      // Remove verified/rejected item from the queue optimistically
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  const reject = async (paymentId: string) => {
    const reason = prompt('Rejection reason (optional):') || '';
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("Action failed: missing access token");
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/payments/${paymentId}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ verified: false, rejection_reason: reason }),
        }
      );
      if (!res.ok) throw new Error(`Reject failed: ${res.status}`);

      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
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
          <div className="text-center text-zinc-500 text-sm">Loading queue...</div>
        ) : payments.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-zinc-700 text-base">No pending payments</p>
            <p className="text-zinc-500 text-sm mt-2">
              All payment proofs are currently verified or rejected.
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
                        {p.ad?.title || 'Ad'}
                      </div>
                      <span className="text-[11px] bg-zinc-100 px-2 py-1 rounded-full text-zinc-700">
                        {p.status}
                      </span>
                    </div>

                    <div className="text-zinc-700 text-sm mt-2 space-y-1">
                      <div>
                        Amount: <span className="text-zinc-900 font-semibold">Rs {p.amount.toFixed(2)}</span>
                      </div>
                      <div>
                        Transaction: <span className="text-zinc-900 font-semibold">{p.transaction_ref}</span>
                      </div>
                      <div>
                        Sender: <span className="text-zinc-900 font-semibold">{p.sender_name}</span>
                      </div>
                      <div>
                        Proof: <span className="text-zinc-900 font-semibold">{p.method}</span>
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
                    <button
                      onClick={() => verify(p.id, true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => reject(p.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
                    >
                      ✗ Reject
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

