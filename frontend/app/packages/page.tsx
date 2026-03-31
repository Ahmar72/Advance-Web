"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useTheme } from "@/lib/ThemeProvider";

type Package = {
  id: string;
  name: string;
  duration_days: number;
  weight: number;
  is_featured: boolean;
  price: number;
  refresh_rule: "none" | "manual" | "auto";
  refresh_interval_days: number | null;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { mode } = useTheme();

  const isDark = mode === "dark";

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from("packages")
          .select(
            "id, name, duration_days, weight, is_featured, price, refresh_rule, refresh_interval_days",
          )
          .eq("is_active", true)
          .order("duration_days", { ascending: true });

        if (queryError) {
          throw new Error(queryError.message);
        }

        setPackages((data as Package[]) || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  return (
    <div
      className={
        isDark
          ? "min-h-screen bg-slate-950"
          : "min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100"
      }
    >
      <div
        className={
          isDark
            ? "border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50"
            : "border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50"
        }
      >
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-2">
          <h1
            className={
              isDark
                ? "text-3xl font-bold text-zinc-50"
                : "text-3xl font-bold text-zinc-900"
            }
          
          >
            Packages
          </h1>
          <p
            className={
              isDark
                ? "text-sm text-zinc-400"
                : "text-sm text-zinc-600"
            }
          >
            Choose a plan to control duration, ranking weight, and featured
            placement.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div
            className={
              isDark
                ? "text-center text-zinc-400"
                : "text-center text-zinc-500"
            }
          >
            Loading packages...
          </div>
        ) : error ? (
          <div className="neon-card bg-red-50 border border-red-300 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        ) : packages.length === 0 ? (
          <div
            className={
              isDark
                ? "neon-card text-center text-zinc-300 py-12 border border-zinc-700 rounded-xl bg-slate-900/60"
                : "neon-card text-center text-zinc-500 py-12 border border-zinc-200 rounded-xl bg-white"
            }
          >
            No packages found.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`neon-card rounded-xl p-6 border ${
                  isDark
                    ? pkg.is_featured
                      ? "bg-slate-900/80"
                      : "bg-slate-900/60"
                    : pkg.is_featured
                    ? "bg-blue-50"
                    : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2
                      className={
                        isDark
                          ? "text-2xl font-bold text-zinc-50"
                          : "text-2xl font-bold text-zinc-900"
                      }
                    >
                      {pkg.name}
                    </h2>
                    {pkg.is_featured && (
                      <span
                        className={
                          isDark
                            ? "inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/20 text-blue-100 border border-blue-500/30"
                            : "inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300"
                        }
                      >
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={
                        isDark
                          ? "text-3xl font-bold text-zinc-50"
                          : "text-3xl font-bold text-zinc-900"
                      }
                    >
                      Rs {pkg.price.toFixed(2)}
                    </div>
                    <div
                      className={
                        isDark
                          ? "text-xs text-zinc-400 mt-1"
                          : "text-xs text-zinc-500 mt-1"
                      }
                    >
                      One-time package price
                    </div>
                  </div>
                </div>

                <div
                  className={
                    isDark
                      ? "space-y-2 text-zinc-300 text-sm"
                      : "space-y-2 text-zinc-600 text-sm"
                  }
                >
                  <div className="flex items-center justify-between gap-4">
                    <span>Duration</span>
                    <span
                      className={
                        isDark
                          ? "text-zinc-50 font-semibold"
                          : "text-zinc-900 font-semibold"
                      }
                    >
                      {pkg.duration_days} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Ranking weight</span>
                    <span
                      className={
                        isDark
                          ? "text-zinc-50 font-semibold"
                          : "text-zinc-900 font-semibold"
                      }
                    >
                      {pkg.weight}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Refresh rule</span>
                    <span
                      className={
                        isDark
                          ? "text-zinc-50 font-semibold"
                          : "text-zinc-900 font-semibold"
                      }
                    >
                      {pkg.refresh_rule}
                    </span>
                  </div>
                  {pkg.refresh_rule !== "none" &&
                    pkg.refresh_interval_days != null && (
                      <div className="flex items-center justify-between gap-4">
                        <span>Refresh every</span>
                        <span
                          className={
                            isDark
                              ? "text-zinc-50 font-semibold"
                              : "text-zinc-900 font-semibold"
                          }
                        >
                          {pkg.refresh_interval_days} days
                        </span>
                      </div>
                    )}
                </div>

                <div
                  className={
                    isDark
                      ? "mt-6 text-xs text-zinc-400"
                      : "mt-6 text-xs text-zinc-500"
                  }
                >
                  Weight and freshness help determine ranking score for public
                  results.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
