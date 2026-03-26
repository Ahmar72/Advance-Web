'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

type Option = { id: string; name: string; slug: string };

type AdDetailForEdit = {
  id: string;
  title: string;
  description: string;
  category_id: string;
  city_id: string;
  status: string;
};

export default function EditAdPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/${params.id}`
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
    fetchAd();
  }, [params.id]);

  const submit = async () => {
    if (!user || !ad) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/client/ads/${params.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
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
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-slate-300 hover:text-white transition text-sm"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-white">Edit Draft</h1>
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
        ) : ad.status !== 'draft' ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <div className="text-white font-semibold text-lg">
              Editing not allowed
            </div>
            <div className="text-slate-400 mt-2">
              Current status: {ad.status}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
              <label className="block">
                <div className="text-slate-300 text-sm mb-1">Title</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white"
                />
              </label>

              <label className="block">
                <div className="text-slate-300 text-sm mb-1">Description</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white resize-none"
                />
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-slate-300 text-sm mb-1">Category</div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="text-slate-300 text-sm mb-1">City</div>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white"
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
                <div className="text-slate-300 text-sm">Media URLs</div>
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
                      className="flex-1 bg-slate-900/40 border border-slate-700 rounded px-4 py-2 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaUrls((prev) => prev.filter((_, i) => i !== idx))}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50"
                      disabled={mediaUrls.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setMediaUrls((prev) => [...prev, ''])}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                >
                  + Add URL
                </button>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="w-full md:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition"
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

