'use client';

import { useEffect, useState } from 'react';

type Package = {
  id: string;
  name: string;
  duration_days: number;
  weight: number;
  is_featured: boolean;
  price: number;
  refresh_rule: 'none' | 'manual' | 'auto';
  refresh_interval_days: number | null;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/packages`
        );
        if (!res.ok) {
          throw new Error(`Failed to load packages: ${res.status}`);
        }

        const json = await res.json();
        setPackages((json.data as Package[]) || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load packages');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Packages</h1>
          <p className="text-slate-400 mt-1">
            Choose a plan to control duration, ranking weight, and featured placement.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center text-slate-400">Loading packages...</div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            No packages found.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-xl p-6 border ${
                  pkg.is_featured
                    ? 'border-blue-400/60 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{pkg.name}</h2>
                    {pkg.is_featured && (
                      <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/20 text-blue-100 border border-blue-500/30">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      Rs {pkg.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      One-time package price
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-slate-300 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span>Duration</span>
                    <span className="text-slate-100 font-semibold">
                      {pkg.duration_days} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Ranking weight</span>
                    <span className="text-slate-100 font-semibold">
                      {pkg.weight}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Refresh rule</span>
                    <span className="text-slate-100 font-semibold">
                      {pkg.refresh_rule}
                    </span>
                  </div>
                  {pkg.refresh_rule !== 'none' && pkg.refresh_interval_days != null && (
                    <div className="flex items-center justify-between gap-4">
                      <span>Refresh every</span>
                      <span className="text-slate-100 font-semibold">
                        {pkg.refresh_interval_days} days
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 text-xs text-slate-400">
                  Weight and freshness help determine ranking score for public results.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

