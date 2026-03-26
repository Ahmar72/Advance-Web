'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
}

interface Package {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  is_featured: boolean;
}

export default function CreateAdPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'media' | 'package' | 'review'>(
    'details'
  );
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    city_id: '',
    media_urls: [''],
  });

  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usingFallbackOptions, setUsingFallbackOptions] = useState(false);
  const [dbOptionsError, setDbOptionsError] = useState<string | null>(null);

  const fallbackCategories: Category[] = [
    { id: 'fallback-electronics', name: 'Electronics' },
    { id: 'fallback-vehicles', name: 'Vehicles' },
    { id: 'fallback-properties', name: 'Properties' },
  ];

  const fallbackCities: City[] = [
    { id: 'fallback-karachi', name: 'Karachi' },
    { id: 'fallback-lahore', name: 'Lahore' },
    { id: 'fallback-islamabad', name: 'Islamabad' },
  ];

  const fallbackPackages: Package[] = [
    { id: 'fallback-basic', name: 'Basic', duration_days: 7, price: 1999, is_featured: false },
    { id: 'fallback-standard', name: 'Standard', duration_days: 15, price: 3999, is_featured: false },
    { id: 'fallback-premium', name: 'Premium', duration_days: 30, price: 6999, is_featured: true },
  ];

  // Fetch categories and cities on mount
  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setUsingFallbackOptions(false);
      setDbOptionsError(null);
      // Reset package selection when reloading options
      setSelectedPackage('');
      // Fetch categories
      const catRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`
      );
      if (catRes.ok) {
        const data = await catRes.json();
        const cats = (data.data || []) as Category[];
        if (cats.length > 0) {
          setCategories(cats);
        } else {
          setCategories(fallbackCategories);
          setUsingFallbackOptions(true);
          setDbOptionsError('No categories were returned from the API.');
        }
      } else {
        const payload = await catRes.json().catch(() => null);
        setCategories(fallbackCategories);
        setUsingFallbackOptions(true);
        setDbOptionsError(
          payload?.message || payload?.error || 'Failed to load categories.'
        );
      }

      // Fetch cities
      const cityRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/cities`
      );
      if (cityRes.ok) {
        const data = await cityRes.json();
        const cts = (data.data || []) as City[];
        if (cts.length > 0) {
          setCities(cts);
        } else {
          setCities(fallbackCities);
          setUsingFallbackOptions(true);
          setDbOptionsError('No cities were returned from the API.');
        }
      } else {
        const payload = await cityRes.json().catch(() => null);
        setCities(fallbackCities);
        setUsingFallbackOptions(true);
        setDbOptionsError(
          payload?.message || payload?.error || 'Failed to load cities.'
        );
      }

      // Fetch packages
      const pkgRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/packages`
      );
      if (pkgRes.ok) {
        const data = await pkgRes.json();
        const pkgs = (data.data || []) as Package[];
        if (pkgs.length > 0) {
          setPackages(pkgs);
        } else {
          setPackages(fallbackPackages);
          setUsingFallbackOptions(true);
          setDbOptionsError('No packages were returned from the API.');
        }
      } else {
        const payload = await pkgRes.json().catch(() => null);
        setPackages(fallbackPackages);
        setUsingFallbackOptions(true);
        setDbOptionsError(
          payload?.message || payload?.error || 'Failed to load packages.'
        );
      }
    } catch (error) {
      console.error('Failed to fetch options:', error);
      setCategories(fallbackCategories);
      setCities(fallbackCities);
      setPackages(fallbackPackages);
      setUsingFallbackOptions(true);
      setDbOptionsError(
        error instanceof Error ? error.message : 'Failed to load DB options.'
      );
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'details') {
      if (!formData.title) newErrors.title = 'Title is required';
      if (formData.title.length < 5)
        newErrors.title = 'Title must be at least 5 characters';
      if (!formData.description)
        newErrors.description = 'Description is required';
      if (formData.description.length < 20)
        newErrors.description = 'Description must be at least 20 characters';
      if (!formData.category_id) newErrors.category = 'Category is required';
      if (!formData.city_id) newErrors.city = 'City is required';
    } else if (step === 'media') {
      const validUrls = formData.media_urls.filter((url) => url.trim());
      if (validUrls.length === 0) newErrors.media = 'At least one media URL is required';
    } else if (step === 'package') {
      if (!selectedPackage) newErrors.package = 'Please select a package';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step === 'details') setStep('media');
    else if (step === 'media') setStep('package');
    else if (step === 'package') setStep('review');
  };

  const handleBack = () => {
    if (step === 'media') setStep('details');
    else if (step === 'package') setStep('media');
    else if (step === 'review') setStep('package');
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (usingFallbackOptions) {
        throw new Error(
          `Database options are not loaded yet.\n\n${dbOptionsError ? `Backend error: ${dbOptionsError}\n\n` : ''}Run 'backend/src/db/001_init_schema.sql' and 'backend/src/db/002_seed_dummy_data.sql' in Supabase SQL Editor (same project as your backend), then refresh and try again.`
        );
      }
      // Step 1: Create ad draft
      const adResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/client/ads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            category_id: formData.category_id,
            city_id: formData.city_id,
            media_urls: formData.media_urls.filter((url) => url.trim()),
          }),
        }
      );

      if (!adResponse.ok) {
        throw new Error('Failed to create ad');
      }

      const { data: ad } = await adResponse.json();

      // Step 2: Select package and submit
      const submitResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ads/${ad.id}/select-package`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ package_id: selectedPackage }),
        }
      );

      if (!submitResponse.ok) {
        throw new Error('Failed to submit ad');
      }

      // Success - redirect to dashboard
      router.push('/dashboard?success=Ad created successfully!');
    } catch (error) {
      console.error('Error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create ad',
      });
    } finally {
      setLoading(false);
    }
  };

  const addMediaUrl = () => {
    setFormData({
      ...formData,
      media_urls: [...formData.media_urls, ''],
    });
  };

  const removeMediaUrl = (index: number) => {
    setFormData({
      ...formData,
      media_urls: formData.media_urls.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Create New Listing</h1>
          <p className="text-slate-400 mt-1">Step {step === 'details' ? 1 : step === 'media' ? 2 : step === 'package' ? 3 : 4} of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/50 border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            {(['details', 'media', 'package', 'review'] as const).map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition ${
                  s === step || ['details', 'media', 'package', 'review'].indexOf(s) < ['details', 'media', 'package', 'review'].indexOf(step)
                    ? 'bg-blue-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {usingFallbackOptions ? (
          <div className="mb-6 rounded-lg border border-yellow-700/50 bg-yellow-500/10 p-4 text-yellow-100 text-sm space-y-3">
            <div>
              Categories/Cities/Packages are using fallback demo options because the API returned
              no data.
            </div>
            {dbOptionsError ? (
              <div className="text-yellow-200">{dbOptionsError}</div>
            ) : null}
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={fetchOptions}
                className="px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100 border border-yellow-500/30 transition"
              >
                Retry loading options
              </button>
              <div className="text-yellow-200/90">
                Tip: run `001_init_schema.sql` + `002_seed_dummy_data.sql` in Supabase SQL Editor for
                the same project as your backend.
              </div>
            </div>
          </div>
        ) : null}
        {/* Step 1: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                Listing Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., iPhone 13 Pro, 256GB"
                className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your item in detail..."
                rows={6}
                className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-400 text-sm mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  City *
                </label>
                <select
                  value={formData.city_id}
                  onChange={(e) =>
                    setFormData({ ...formData, city_id: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-red-400 text-sm mt-1">{errors.city}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Media URLs */}
        {step === 'media' && (
          <div className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-4">
                Media URLs *
              </label>
              <p className="text-slate-400 text-sm mb-4">
                Add external image or video URLs (YouTube, direct image links)
              </p>

              <div className="space-y-3">
                {formData.media_urls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...formData.media_urls];
                        newUrls[index] = e.target.value;
                        setFormData({ ...formData, media_urls: newUrls });
                      }}
                      placeholder={`URL ${index + 1} (e.g., https://...)`}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    {formData.media_urls.length > 1 && (
                      <button
                        onClick={() => removeMediaUrl(index)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {errors.media && (
                <p className="text-red-400 text-sm mt-2">{errors.media}</p>
              )}

              <button
                onClick={addMediaUrl}
                className="mt-4 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition"
              >
                + Add Another URL
              </button>
            </div>

            <div className="bg-slate-700/50 border border-slate-700 rounded p-4">
              <p className="text-slate-300 text-sm">
                <strong>💡 Tip:</strong> For YouTube videos, paste the full URL
                (e.g., https://youtube.com/watch?v=...). We'll auto-generate thumbnails.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Package Selection */}
        {step === 'package' && (
          <div className="space-y-6">
            <label className="block text-white font-semibold mb-4">
              Select Package *
            </label>

            <div className="grid gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition ${
                    selectedPackage === pkg.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {pkg.name}
                        {pkg.is_featured && (
                          <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                            FEATURED
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">
                        {pkg.duration_days} days visibility
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        Rs {pkg.price}
                      </p>
                    </div>
                  </div>

                  {selectedPackage === pkg.id && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-blue-400 text-sm font-semibold">
                        ✓ Selected
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {errors.package && (
              <p className="text-red-400 text-sm">{errors.package}</p>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Review Your Listing
              </h2>

              <div className="space-y-4 text-slate-300">
                <div>
                  <p className="text-slate-400 text-sm">Title</p>
                  <p className="text-white font-semibold">{formData.title}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">Description</p>
                  <p className="text-white">{formData.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Category</p>
                    <p className="text-white font-semibold">
                      {
                        categories.find((c) => c.id === formData.category_id)
                          ?.name
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">City</p>
                    <p className="text-white font-semibold">
                      {cities.find((c) => c.id === formData.city_id)?.name}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">Media URLs</p>
                  <div className="space-y-1 mt-1">
                    {formData.media_urls
                      .filter((url) => url.trim())
                      .map((url, i) => (
                        <p key={i} className="text-blue-400 text-sm truncate">
                          {i + 1}. {url}
                        </p>
                      ))}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4 mt-4">
                  <p className="text-slate-400 text-sm">Package</p>
                  <p className="text-white font-semibold">
                    {packages.find((p) => p.id === selectedPackage)?.name} - Rs{' '}
                    {packages.find((p) => p.id === selectedPackage)?.price}
                  </p>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-600/20 border border-red-600 rounded p-4">
                <p className="text-red-300">{errors.submit}</p>
              </div>
            )}

            <div className="bg-blue-600/20 border border-blue-600 rounded p-4">
              <p className="text-blue-300">
                <strong>Next Step:</strong> After submission, your ad will enter
                moderation. You'll receive a notification once approved.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-10">
          {step !== 'details' && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
            >
              ← Back
            </button>
          )}

          {step !== 'review' ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
