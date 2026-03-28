"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface SearchResult {
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
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
}

type ExploreSuggestionRow = {
  title: string | null;
};

type ExploreSearchRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  category:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  city:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  package:
    | { name?: string; price?: number; is_featured?: boolean }
    | {
        name?: string;
        price?: number;
        is_featured?: boolean;
      }[]
    | null;
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

export default function ExplorePage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<
    "relevance" | "newest" | "price_asc" | "price_desc" | "popular"
  >("relevance");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const hasLoadedOnceRef = useRef(false);

  // Fetch categories and cities on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesQuery, citiesQuery] = await Promise.all([
          supabase
            .from("categories")
            .select("id, name, slug")
            .eq("is_active", true)
            .order("name", { ascending: true }),
          supabase
            .from("cities")
            .select("id, name, slug")
            .eq("is_active", true)
            .order("name", { ascending: true }),
        ]);

        if (!categoriesQuery.error) {
          setCategories((categoriesQuery.data as Category[]) || []);
        }
        if (!citiesQuery.error) {
          setCities((citiesQuery.data as City[]) || []);
        }
      } catch (error) {
        console.error("Failed to fetch filters:", error);
      }
    };

    fetchFilters();
  }, []);

  // Fetch suggestions when search query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from("ads")
            .select("title")
            .eq("status", "published")
            .ilike("title", `%${searchQuery}%`)
            .limit(8);

          if (error) return;

          const rows = (data || []) as ExploreSuggestionRow[];
          const titles = Array.from(
            new Set(rows.map((row) => String(row.title || "").trim())),
          ).filter(Boolean);

          setSuggestions(titles);
        } catch (error) {
          console.error("Failed to fetch suggestions:", error);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  // Debounce main search query to reduce request bursts while typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchResults = useCallback(async () => {
    try {
      if (!hasLoadedOnceRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const pageSize = 20;
      let query = supabase
        .from("ads")
        .select(
          "id, title, description, status, created_at, category:categories(name, slug), city:cities(name, slug), package:packages(name, price, is_featured), seller:users(full_name, email, is_verified_seller), media:ad_media(original_url, thumbnail_url)",
        );

      // Show only approved ads in explore.
      // RLS will still limit anonymous users to statuses they can read.
      query = query.in("status", [
        "payment_pending",
        "payment_verified",
        "scheduled",
        "published",
      ]);

      query = query.order("created_at", { ascending: false }).limit(500);

      if (debouncedSearchQuery) {
        query = query.or(
          `title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`,
        );
      }

      if (categoryFilter) {
        query = query.eq("category.slug", categoryFilter);
      }

      if (cityFilter) {
        query = query.eq("city.slug", cityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const rows = (data || []) as unknown as ExploreSearchRow[];
      let mapped: SearchResult[] = rows.map((row) => ({
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
          row.media?.[0]?.thumbnail_url || row.media?.[0]?.original_url || null,
        seller_name: Array.isArray(row.seller)
          ? row.seller[0]?.full_name || row.seller[0]?.email || "Unknown"
          : row.seller?.full_name || row.seller?.email || "Unknown",
        seller_verified: Array.isArray(row.seller)
          ? Boolean(row.seller[0]?.is_verified_seller)
          : Boolean(row.seller?.is_verified_seller),
        status: row.status,
        created_at: row.created_at,
      }));

      if (minPrice) {
        const minValue = Number(minPrice);
        if (!Number.isNaN(minValue)) {
          mapped = mapped.filter((r) => r.price >= minValue);
        }
      }

      if (maxPrice) {
        const maxValue = Number(maxPrice);
        if (!Number.isNaN(maxValue)) {
          mapped = mapped.filter((r) => r.price <= maxValue);
        }
      }

      if (sortBy === "price_asc") {
        mapped.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price_desc") {
        mapped.sort((a, b) => b.price - a.price);
      } else if (sortBy === "popular") {
        mapped.sort((a, b) => {
          if (a.seller_verified !== b.seller_verified) {
            return Number(b.seller_verified) - Number(a.seller_verified);
          }
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      }

      const totalRecords = mapped.length;
      const paged = mapped.slice((page - 1) * pageSize, page * pageSize);

      setResults(paged);
      setTotal(totalRecords);
      setTotalPages(Math.max(1, Math.ceil(totalRecords / pageSize)));
      hasLoadedOnceRef.current = true;
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    debouncedSearchQuery,
    categoryFilter,
    cityFilter,
    minPrice,
    maxPrice,
    sortBy,
    page,
  ]);

  // Fetch search results
  useEffect(() => {
    void fetchResults();
  }, [fetchResults]);

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white mb-4">
            Explore Listings
          </h1>

          {/* Advanced Search */}
          <div className="space-y-4">
            {/* Search bar with autocomplete */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search titles, descriptions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                  setShowSuggestions(true);
                }}
                onFocus={() =>
                  suggestions.length > 0 && setShowSuggestions(true)
                }
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                        setPage(1);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-400 hover:bg-slate-700 hover:text-white transition first:rounded-t-lg last:rounded-b-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-5 gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.slug}>
                    {city.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />

              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(
                    e.target.value as
                      | "relevance"
                      | "newest"
                      | "price_asc"
                      | "price_desc"
                      | "popular",
                  );
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results count */}
        {!loading && (
          <div className="text-slate-400 text-sm mb-4">
            Found {total} listing{total !== 1 ? "s" : ""}
            {searchQuery && ` for "${searchQuery}"`}
            {refreshing ? " • Updating..." : ""}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading ads...</div>
        ) : results.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <p>
              No listings found. Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/ads/${result.id}`}
                className="block bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-lg transition group"
              >
                {/* Image */}
                {result.image_url ? (
                  <img
                    src={result.image_url}
                    alt={result.title}
                    className="h-48 w-full object-cover group-hover:opacity-75 transition"
                  />
                ) : (
                  <div className="h-48 bg-linear-to-br from-slate-700 to-slate-900 group-hover:opacity-80 transition"></div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition line-clamp-2">
                    {result.title}
                  </h3>

                  <p className="text-slate-400 text-sm line-clamp-2 my-2">
                    {result.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex gap-2 text-xs text-slate-500 mb-3">
                    <span className="bg-slate-700 px-2 py-1 rounded">
                      {result.category}
                    </span>
                    <span className="bg-slate-700 px-2 py-1 rounded">
                      {result.city}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                    <div>
                      <p className="text-lg font-bold text-blue-400">
                        Rs {result.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        by{" "}
                        <span className="text-slate-400">
                          {result.seller_name}
                        </span>
                        {result.seller_verified && (
                          <span className="text-green-400 ml-1">✓</span>
                        )}
                      </p>
                    </div>
                    <span className="text-blue-400 text-sm group-hover:text-blue-300">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white disabled:opacity-50 hover:border-blue-500 transition"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, page - 2) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-4 py-2 rounded transition ${
                    page === pageNum
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 border border-slate-700 text-white hover:border-blue-500"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded text-white disabled:opacity-50 hover:border-blue-500 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
