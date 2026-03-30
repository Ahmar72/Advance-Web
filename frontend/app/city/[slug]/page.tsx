"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type SearchResult = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  image_url: string | null;
  seller_name: string;
  seller_verified: boolean;
  status: string;
  created_at: string;
};

type CitySearchRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  category: { name: string } | { name: string }[] | null;
  city: { name: string } | { name: string }[] | null;
  package: { price: number } | { price: number }[] | null;
  seller:
    | { full_name: string | null; email: string; is_verified_seller?: boolean }
    | {
        full_name: string | null;
        email: string;
        is_verified_seller?: boolean;
      }[]
    | null;
  media: Array<{ original_url: string; thumbnail_url: string | null }> | null;
};

export default function CityPage({ params }: { params: { slug: string } }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const slug = params.slug;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const pageSize = 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const {
          data,
          error: queryError,
          count,
        } = await supabase
          .from("ads")
          .select(
            "id, title, description, status, created_at, category:categories(name), city:cities!inner(name, slug), package:packages(price), seller:users(full_name, email, is_verified_seller), media:ad_media(original_url, thumbnail_url)",
            { count: "exact" },
          )
          .eq("status", "published")
          .eq("city.slug", slug)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (queryError) throw queryError;

        const rows = (data || []) as unknown as CitySearchRow[];
        const mapped: SearchResult[] = rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          price: Number(
            (Array.isArray(row.package)
              ? row.package[0]?.price
              : row.package?.price) || 0,
          ),
          category: Array.isArray(row.category)
            ? row.category[0]?.name || "Category"
            : row.category?.name || "Category",
          city: Array.isArray(row.city)
            ? row.city[0]?.name || "City"
            : row.city?.name || "City",
          image_url:
            row.media?.[0]?.thumbnail_url ||
            row.media?.[0]?.original_url ||
            null,
          seller_name: Array.isArray(row.seller)
            ? row.seller[0]?.full_name || row.seller[0]?.email || "Unknown"
            : row.seller?.full_name || row.seller?.email || "Unknown",
          seller_verified: Array.isArray(row.seller)
            ? Boolean(row.seller[0]?.is_verified_seller)
            : Boolean(row.seller?.is_verified_seller),
          status: row.status,
          created_at: row.created_at,
        }));

        setResults(mapped);
        setTotalPages(Math.max(1, Math.ceil((count || 0) / pageSize)));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [slug, page]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">City</h1>
          <p className="text-slate-400 mt-1">Browse listings for: {slug}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            No listings found.
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/ads/${result.id}`}
                  className="block bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-lg transition"
                >
                  {result.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.image_url}
                      alt={result.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="h-48 bg-linear-to-br from-slate-700 to-slate-900" />
                  )}

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">
                      {result.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2 my-2">
                      {result.description}
                    </p>
                    <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                      <div>
                        <p className="text-lg font-bold text-blue-400">
                          Rs {result.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          by{" "}
                          <span className="text-slate-400">
                            {result.seller_name}
                          </span>
                          {result.seller_verified ? (
                            <span className="text-green-400 ml-1">✓</span>
                          ) : null}
                        </p>
                      </div>
                      <span className="text-blue-400 text-sm">View →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white disabled:opacity-50 hover:border-blue-500 transition"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-slate-300 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white disabled:opacity-50 hover:border-blue-500 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
