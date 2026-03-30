"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase/client";

type AdDetailMinimal = {
  id: string;
  status: string;
  title: string;
  package: { id: string; name: string } | null;
};

type AdDetailMinimalRow = {
  id: string;
  status: string;
  title: string;
  package: { id: string; name: string } | { id: string; name: string }[] | null;
};

type PaymentMethod = "bank_transfer" | "card" | "mobile_wallet" | "cash";

const PAYABLE_STATUSES = ["under_review", "payment_pending"];

export default function PaymentPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const adId = params.id;

  const [ad, setAd] = useState<AdDetailMinimal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/signin");
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from("ads")
          .select("id, status, title, package:packages(id, name)")
          .eq("id", adId)
          .eq("user_id", user?.id || "")
          .maybeSingle();

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!data) {
          setAd(null);
          return;
        }

        const row = data as unknown as AdDetailMinimalRow;
        const mapped: AdDetailMinimal = {
          id: row.id,
          status: row.status,
          title: row.title,
          package: Array.isArray(row.package)
            ? row.package[0] || null
            : (row.package ?? null),
        };

        setAd(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load ad");
      } finally {
        setLoading(false);
      }
    };
    if (adId && user?.id) {
      fetchAd();
    }
  }, [adId, user?.id]);

  const submitPayment = async () => {
    if (!user || !ad) return;
    if (!PAYABLE_STATUSES.includes(ad.status)) {
      setError(`Payment not allowed while ad is ${ad.status}.`);
      return;
    }
    if (!ad.package?.id) {
      setError(
        "This ad has no package selected. Please select a package first.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const amountNumber = Number(amount);
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        throw new Error("Please enter a valid payment amount.");
      }

      const { error: insertError } = await supabase.from("payments").insert({
        ad_id: adId,
        package_id: ad.package.id,
        amount: amountNumber,
        method,
        transaction_ref: transactionRef,
        sender_name: senderName,
        screenshot_url: screenshotUrl.trim() ? screenshotUrl.trim() : null,
        status: "pending",
      });

      if (insertError) throw new Error(insertError.message);

      const { error: adUpdateError } = await supabase
        .from("ads")
        .update({ status: "payment_pending" })
        .eq("id", adId)
        .eq("user_id", user.id)
        .in("status", PAYABLE_STATUSES);

      if (adUpdateError) throw new Error(adUpdateError.message);

      router.push(`/ads/${adId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-b from-amber-50 via-orange-50 to-cyan-50 font-['Space_Grotesk',ui-sans-serif,system-ui]">
      <div className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={`/ads/${adId}`}
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            ← Back to ad
          </Link>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Secure Payment
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading || loading ? (
          <div className="rounded-3xl border border-zinc-200 bg-white/90 p-12 text-center text-zinc-500 shadow-sm">
            Loading payment details...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : !ad ? (
          <div className="rounded-3xl border border-zinc-200 bg-white/90 p-12 text-center text-zinc-500 shadow-sm">
            Ad not found.
          </div>
        ) : !PAYABLE_STATUSES.includes(ad.status) ? (
          <div className="rounded-3xl border border-zinc-200 bg-white/95 p-10 text-center shadow-sm">
            <div className="text-xl font-bold text-zinc-900">
              Payment not allowed for this ad
            </div>
            <div className="mt-2 text-zinc-600">
              Current status: {ad.status}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <section className="rounded-3xl border border-zinc-200 bg-white/95 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Listing Summary
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-zinc-900">
                Submit Payment Proof
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Confirm your transaction details so our team can verify and
                publish your listing quickly.
              </p>

              <div className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Ad
                  </p>
                  <p className="mt-1 text-base font-bold text-zinc-900">
                    {ad.title}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                    Package: {ad.package?.name || "Not selected"}
                  </span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Status: {ad.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
                <p className="font-semibold text-zinc-800">
                  Tips for faster approval
                </p>
                <p className="mt-2">
                  Use the exact amount paid and include a clear
                  reference/screenshot URL when available.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white/95 p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <div className="mb-1.5 text-sm font-semibold text-zinc-700">
                    Amount
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    placeholder="5000"
                  />
                </label>

                <div className="block">
                  <div className="mb-1.5 text-sm font-semibold text-zinc-700">
                    Method
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "bank_transfer", label: "Bank" },
                      { value: "card", label: "Card" },
                      { value: "mobile_wallet", label: "Wallet" },
                      { value: "cash", label: "Cash" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMethod(option.value as PaymentMethod)}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                          method === option.value
                            ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                            : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <div className="mb-1.5 text-sm font-semibold text-zinc-700">
                    Transaction Reference
                  </div>
                  <input
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    placeholder="TXN-123456"
                  />
                </label>

                <label className="block">
                  <div className="mb-1.5 text-sm font-semibold text-zinc-700">
                    Sender Name
                  </div>
                  <input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                    placeholder="Muhammad Ali"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <div className="mb-1.5 text-sm font-semibold text-zinc-700">
                  Screenshot URL (optional)
                </div>
                <input
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="https://example.com/proof.jpg"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </label>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.push(`/ads/${adId}`)}
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitPayment}
                  className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 px-7 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-200 transition hover:from-cyan-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Payment Proof"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
