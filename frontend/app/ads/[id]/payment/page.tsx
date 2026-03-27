'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

type AdDetailMinimal = {
  id: string;
  status: string;
  title: string;
  package: { id: string; name: string };
};

type PaymentMethod = 'bank_transfer' | 'card' | 'mobile_wallet' | 'cash';

export default function PaymentPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const adId = params.id;

  const [ad, setAd] = useState<AdDetailMinimal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/signin');
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/${adId}`
        );
        if (!res.ok) throw new Error(`Failed to load ad: ${res.status}`);

        const json = await res.json();
        setAd(json.data as AdDetailMinimal);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load ad');
      } finally {
        setLoading(false);
      }
    };
    if (adId) {
      fetchAd();
    }
  }, [adId]);

  const submitPayment = async () => {
    if (!user || !ad) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/${adId}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            package_id: ad.package.id,
            amount: Number(amount),
            method,
            transaction_ref: transactionRef,
            sender_name: senderName,
            screenshot_url: screenshotUrl.trim() ? screenshotUrl.trim() : undefined,
          }),
        }
      );

      if (!res.ok) throw new Error(`Payment failed: ${res.status}`);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-slate-300 hover:text-white transition text-sm"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-white">Submit Payment Proof</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {isLoading || loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg text-sm">
            {error}
          </div>
        ) : !ad ? (
          <div className="text-center text-slate-400">Ad not found.</div>
        ) : ad.status !== 'payment_pending' ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <div className="text-white font-semibold text-lg">
              Payment not allowed for this ad
            </div>
            <div className="text-slate-400 mt-2">
              Current status: {ad.status}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="text-slate-400 text-sm">Ad</div>
              <div className="text-white font-semibold mt-2">{ad.title}</div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-slate-300 text-sm mb-1">Amount</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white"
                  />
                </label>

                <label className="block">
                  <div className="text-slate-300 text-sm mb-1">Method</div>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="mobile_wallet">Mobile Wallet</option>
                    <option value="cash">Cash</option>
                  </select>
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-slate-300 text-sm mb-1">Transaction Reference</div>
                  <input
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white"
                  />
                </label>

                <label className="block">
                  <div className="text-slate-300 text-sm mb-1">Sender Name</div>
                  <input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white"
                  />
                </label>
              </div>

              <label className="block">
                <div className="text-slate-300 text-sm mb-1">
                  Screenshot URL (optional)
                </div>
                <input
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white"
                />
              </label>

              <div className="flex flex-col md:flex-row gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 md:flex-none px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitPayment}
                  className="flex-1 md:flex-none px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

