'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type AdMedia = {
  original_url: string;
  thumbnail_url: string | null;
  source_type: 'image' | 'youtube' | 'external';
  validation_status: 'pending' | 'valid' | 'invalid';
};

type AdDetail = {
  id: string;
  title: string;
  description: string;
  status: string;
  publish_at: string | null;
  expire_at: string | null;
  category: { name: string };
  city: { name: string };
  package: { name: string; duration_days: number; is_featured: boolean; weight: number; price: number };
  seller: { email: string; full_name: string | null } | null;
  media: AdMedia[];
};

export default function AdDetailPage({ params }: { params: { id: string } }) {
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/${params.id}`
        );
        if (!res.ok) {
          throw new Error(`Failed to load ad: ${res.status}`);
        }

        const json = await res.json();
        setAd(json.data as AdDetail);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load ad');
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [params.id]);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link
            href="/explore"
            className="text-slate-300 hover:text-white transition text-sm"
          >
            ← Back to Explore
          </Link>
          <h1 className="text-2xl font-bold text-white line-clamp-1">
            {ad?.title || 'Ad Detail'}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center text-slate-400">Loading ad...</div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : !ad ? (
          <div className="text-center text-slate-400 py-12">Ad not found.</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
                {ad.media?.length ? (
                  <div className="grid sm:grid-cols-2 gap-0">
                    {ad.media.map((m, idx) => {
                      const src = m.thumbnail_url || m.original_url;
                      return (
                        <div
                          key={`${m.original_url}-${idx}`}
                          className="bg-slate-900/40 p-2 border-b sm:border-b-0 sm:border-r border-slate-700/60"
                        >
                          {/* For YouTube, backend returns a thumbnail_url; for images, it's the original */}
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={src}
                              alt={ad.title}
                              className="w-full h-56 object-cover rounded-lg"
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 bg-slate-900/40" />
                )}
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {ad.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="bg-slate-700 text-slate-200 px-2 py-1 rounded">
                        {ad.category?.name || 'Unknown category'}
                      </span>
                      <span className="bg-slate-700 text-slate-200 px-2 py-1 rounded">
                        {ad.city?.name || 'Unknown city'}
                      </span>
                      <span className="bg-slate-700 text-slate-200 px-2 py-1 rounded">
                        {ad.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-blue-300 hover:text-blue-200 transition border border-blue-400/30 px-3 py-2 rounded">
                    Report
                  </button>
                </div>

                <p className="text-slate-300 mt-4 whitespace-pre-wrap leading-relaxed">
                  {ad.description}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="text-sm font-semibold text-slate-200">
                  Seller
                </h3>
                <div className="mt-3 text-slate-300 text-sm">
                  <div className="font-medium text-white">
                    {ad.seller?.full_name || ad.seller?.email || 'Unknown'}
                  </div>
                  <div className="text-slate-400">
                    {ad.seller?.email || 'No email'}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="text-sm font-semibold text-slate-200">
                  Package
                </h3>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between gap-4">
                    <span>Plan</span>
                    <span className="text-slate-100 font-semibold">
                      {ad.package?.name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Duration</span>
                    <span className="text-slate-100 font-semibold">
                      {ad.package?.duration_days || 0} days
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Price</span>
                    <span className="text-slate-100 font-semibold">
                      Rs {ad.package?.price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Weight</span>
                    <span className="text-slate-100 font-semibold">
                      {ad.package?.weight || 1}x
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="text-sm font-semibold text-slate-200">
                  Availability
                </h3>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between gap-4">
                    <span>Published</span>
                    <span className="text-slate-100 font-semibold">
                      {ad.publish_at ? new Date(ad.publish_at).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Expires</span>
                    <span className="text-slate-100 font-semibold">
                      {ad.expire_at ? new Date(ad.expire_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

