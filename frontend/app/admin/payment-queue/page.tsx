'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

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

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/payments?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
      const body = { verified };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/payments/${paymentId}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/payments/${paymentId}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-slate-300 hover:text-white transition text-sm"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-white">Payment Verification Queue</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        {error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg text-sm">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-center text-slate-400">Loading queue...</div>
        ) : payments.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">No pending payments</p>
            <p className="text-slate-500 text-sm mt-2">
              All payment proofs are currently verified or rejected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <div
                key={p.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-white font-semibold text-lg">
                        {p.ad?.title || 'Ad'}
                      </div>
                      <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-200">
                        {p.status}
                      </span>
                    </div>

                    <div className="text-slate-300 text-sm mt-2 space-y-1">
                      <div>
                        Amount: <span className="text-slate-100 font-semibold">Rs {p.amount.toFixed(2)}</span>
                      </div>
                      <div>
                        Transaction: <span className="text-slate-100 font-semibold">{p.transaction_ref}</span>
                      </div>
                      <div>
                        Sender: <span className="text-slate-100 font-semibold">{p.sender_name}</span>
                      </div>
                      <div>
                        Proof: <span className="text-slate-100 font-semibold">{p.method}</span>
                      </div>
                      {p.rejection_reason ? (
                        <div className="text-red-300">
                          Rejection reason: {p.rejection_reason}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                    <Link
                      href={`/ads/${p.ad.id}`}
                      className="px-4 py-2 bg-slate-900/40 border border-slate-700 rounded text-slate-200 hover:border-blue-400 transition text-center"
                    >
                      View Ad
                    </Link>
                    <button
                      onClick={() => verify(p.id, true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => reject(p.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition"
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
    </div>
  );
}

