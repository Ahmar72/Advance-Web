'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';

type Option = { id: string; name: string; slug: string };

type AdDetailForEdit = {
  id: string;
  title: string;
  description: string;
  category_id: string;
  city_id: string;
  status: string;
};

export default function EditAdPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const adId = params.id;

  const [ad, setAd] = useState<AdDetailForEdit | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>(['']);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/signin');
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchOptions = async () => {
      const [catRes, cityRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cities`),
      ]);

      const [catJson, cityJson] = await Promise.all([
        catRes.json(),
        cityRes.json(),
      ]);

      setCategories((catJson.data as Option[]) || []);
      setCities((cityJson.data as Option[]) || []);
    };

    const fetchAd = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/${adId}`
        );
        if (!res.ok) throw new Error(`Failed to load ad: ${res.status}`);

        const json = await res.json();
        const data = json.data as {
          id: string;
          title: string;
          description: string;
          category_id: string;
          city_id: string;
          status: string;
          media?: Array<{ original_url: string }>;
        };

        const adDetail: AdDetailForEdit = {
          id: data.id,
          title: data.title,
          description: data.description,
          category_id: data.category_id,
          city_id: data.city_id,
          status: data.status,
        };
        setAd(adDetail);
        setTitle(adDetail.title);
        setDescription(adDetail.description);
        setCategoryId(adDetail.category_id);
        setCityId(adDetail.city_id);

        const existingMedia = data.media || [];
        setMediaUrls(existingMedia.length ? existingMedia.map((m) => m.original_url) : ['']);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load ad');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
    if (adId) {
      fetchAd();
    }
  }, [adId]);

  const submit = async () => {
    if (!user || !ad) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(
          'Your session has expired. Please sign in again before updating this listing.'
        );
      }

      const accessToken = sessionData.session.access_token;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/${adId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title,
            description,
            category_id: categoryId,
            city_id: cityId,
            media_urls: mediaUrls.filter((u) => u.trim()),
          }),
        }
      );

      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Edit Draft</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading || loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg text-sm">
            {error}
          </div>
        ) : !ad ? (
          <div className="text-center text-zinc-500">Ad not found.</div>
        ) : ad.status !== 'draft' ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-zinc-900 font-semibold text-lg">
              Editing not allowed
            </div>
            <div className="text-zinc-500 mt-2">
              Current status: {ad.status}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm">
              <label className="block">
                <div className="text-zinc-800 text-sm mb-1 font-medium">Title</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block">
                <div className="text-zinc-800 text-sm mb-1 font-medium">Description</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-zinc-800 text-sm mb-1 font-medium">Category</div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="text-zinc-800 text-sm mb-1 font-medium">City</div>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <div className="text-zinc-800 text-sm font-medium">Media URLs</div>
                {mediaUrls.map((url, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={url}
                      onChange={(e) => {
                        const next = [...mediaUrls];
                        next[idx] = e.target.value;
                        setMediaUrls(next);
                      }}
                      placeholder="https://..."
                      className="flex-1 bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaUrls((prev) => prev.filter((_, i) => i !== idx))}
                      className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-xs font-medium disabled:opacity-50 border border-zinc-300"
                      disabled={mediaUrls.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setMediaUrls((prev) => [...prev, ''])}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition shadow-sm"
                >
                  + Add URL
                </button>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="w-full md:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition shadow-sm"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

