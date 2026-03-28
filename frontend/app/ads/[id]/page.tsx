"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";

type AdMedia = {
  original_url: string;
  thumbnail_url: string | null;
  source_type: "image" | "youtube" | "external" | "upload";
  validation_status: "pending" | "approved" | "rejected" | "valid" | "invalid";
};

type AdDetail = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  moderation_remark: string | null;
  publish_at: string | null;
  expire_at: string | null;
  category: { name: string };
  city: { name: string };
  package: {
    name: string;
    duration_days: number;
    is_featured: boolean;
    price: number;
  };
  seller: { email: string; full_name: string | null } | null;
  media: AdMedia[];
};

type AdDetailRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  moderation_remark: string | null;
  publish_at: string | null;
  expire_at: string | null;
  category: { name: string } | { name: string }[] | null;
  city: { name: string } | { name: string }[] | null;
  package:
    | {
        name: string;
        duration_days: number;
        is_featured: boolean;
        price: number;
      }
    | {
        name: string;
        duration_days: number;
        is_featured: boolean;
        price: number;
      }[]
    | null;
  seller:
    | { email: string; full_name: string | null }
    | { email: string; full_name: string | null }[]
    | null;
  media: AdMedia[] | null;
};

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function nextIndex(current: number, length: number): number {
  if (length === 0) return 0;
  return (current + 1) % length;
}

function prevIndex(current: number, length: number): number {
  if (length === 0) return 0;
  return (current - 1 + length) % length;
}

export default function AdDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useSupabaseAuth();
  const adId = params.id;
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from("ads")
          .select(
            "id, user_id, title, description, status, moderation_remark, publish_at, expire_at, category:categories(name), city:cities(name), package:packages(name, duration_days, is_featured, price), seller:users(email, full_name), media:ad_media(original_url, thumbnail_url, source_type, validation_status)",
          )
          .eq("id", adId)
          .maybeSingle();

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!data) {
          setAd(null);
          return;
        }

        const row = data as unknown as AdDetailRow;
        const mapped: AdDetail = {
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          description: row.description,
          status: row.status,
          moderation_remark: row.moderation_remark,
          publish_at: row.publish_at,
          expire_at: row.expire_at,
          category: Array.isArray(row.category)
            ? row.category[0]
            : row.category || { name: "Unknown category" },
          city: Array.isArray(row.city)
            ? row.city[0]
            : row.city || { name: "Unknown city" },
          package: Array.isArray(row.package)
            ? row.package[0]
            : row.package || {
                name: "—",
                duration_days: 0,
                is_featured: false,
                price: 0,
              },
          seller: Array.isArray(row.seller) ? row.seller[0] : row.seller,
          media: row.media || [],
        };

        setAd(mapped);
        setActiveMediaIndex(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load ad");
      } finally {
        setLoading(false);
      }
    };
    if (adId) {
      fetchAd();
    }
  }, [adId]);

  const activeMedia = ad?.media?.[activeMediaIndex] ?? null;
  const isOwner = Boolean(user?.id && ad?.user_id && user.id === ad.user_id);
  const activeMediaSrc = activeMedia
    ? activeMedia.thumbnail_url || activeMedia.original_url
    : null;

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center text-zinc-500">Loading ad...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : !ad ? (
          <div className="text-center text-zinc-500 py-12">Ad not found.</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Link
                href={"/dashboard"}
                className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ← Go Back
              </Link>
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                {ad.media?.length ? (
                  <div className="p-3 space-y-3">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-100 overflow-hidden">
                      {activeMediaSrc ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeMediaSrc}
                            alt={ad.title}
                            className="w-full h-72 sm:h-80 object-cover"
                          />

                          {ad.media.length > 1 ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMediaIndex((current) =>
                                    prevIndex(current, ad.media.length),
                                  )
                                }
                                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 text-white px-2.5 py-1.5 text-xs hover:bg-black/60"
                                aria-label="Previous image"
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMediaIndex((current) =>
                                    nextIndex(current, ad.media.length),
                                  )
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 text-white px-2.5 py-1.5 text-xs hover:bg-black/60"
                                aria-label="Next image"
                              >
                                ›
                              </button>
                              <div className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white">
                                {activeMediaIndex + 1}/{ad.media.length}
                              </div>
                            </>
                          ) : null}
                        </div>
                      ) : (
                        <div className="h-80 flex items-center justify-center text-zinc-400 text-sm">
                          No preview available
                        </div>
                      )}
                    </div>

                    {ad.media.length > 1 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {ad.media.map((m, idx) => {
                          const src = m.thumbnail_url || m.original_url;
                          return (
                            <button
                              key={`${m.original_url}-${idx}`}
                              type="button"
                              onClick={() => setActiveMediaIndex(idx)}
                              className={`rounded-lg overflow-hidden border transition ${
                                idx === activeMediaIndex
                                  ? "border-blue-500 ring-2 ring-blue-200"
                                  : "border-zinc-200 hover:border-zinc-400"
                              }`}
                              aria-label={`View media ${idx + 1}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src || m.original_url}
                                alt={`${ad.title} thumbnail ${idx + 1}`}
                                className="w-full h-16 object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="h-64 bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm">
                    No media uploaded for this listing.
                  </div>
                )}
              </div>

              <h1 className="text-2xl font-bold text-zinc-900 my-6 line-clamp-1">
                {ad?.title || "Ad Detail"}
              </h1>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">
                      {ad.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded">
                        {ad.category?.name || "Unknown category"}
                      </span>
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded">
                        {ad.city?.name || "Unknown city"}
                      </span>
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded capitalize">
                        {ad.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {isOwner ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/ads/${ad.id}/edit`}
                          className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Edit listing
                        </Link>
                        <Link
                          href={`/ads/${ad.id}/payment`}
                          className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          Manage payment
                        </Link>
                      </div>
                    ) : null}
                  </div>
                  <button className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition border border-blue-200 px-3 py-2 rounded-lg bg-blue-50">
                    Report
                  </button>
                </div>

                <p className="text-zinc-700 mt-4 whitespace-pre-wrap leading-relaxed">
                  {ad.description}
                </p>

                {ad.moderation_remark ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <span className="font-semibold">Moderator remark: </span>
                    {ad.moderation_remark}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-zinc-700">Seller</h3>
                <div className="mt-3 text-zinc-600 text-sm">
                  <div className="font-medium text-zinc-900">
                    {ad.seller?.full_name || ad.seller?.email || "Unknown"}
                  </div>
                  <div className="text-zinc-500">
                    {ad.seller?.email || "No email"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-zinc-700">Package</h3>
                <div className="mt-3 space-y-2 text-sm text-zinc-600">
                  <div className="flex justify-between gap-4">
                    <span>Plan</span>
                    <span className="text-zinc-900 font-semibold">
                      {ad.package?.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Duration</span>
                    <span className="text-zinc-900 font-semibold">
                      {ad.package?.duration_days || 0} days
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Price</span>
                    <span className="text-zinc-900 font-semibold">
                      Rs {ad.package?.price?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-zinc-700">
                  Availability
                </h3>
                <div className="mt-3 space-y-2 text-sm text-zinc-600">
                  <div className="flex justify-between gap-4">
                    <span>Published</span>
                    <span className="text-zinc-900 font-semibold">
                      {formatDateTime(ad.publish_at)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Expires</span>
                    <span className="text-zinc-900 font-semibold">
                      {formatDateTime(ad.expire_at)}
                    </span>
                  </div>
                </div>
              </div>

              {isOwner ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-zinc-700">
                    Owner actions
                  </h3>
                  <div className="mt-3 flex flex-col gap-2">
                    <Link
                      href={`/ads/${ad.id}/edit`}
                      className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Edit this ad
                    </Link>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Back to dashboard
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
