"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { supabase } from "@/lib/supabaseClient";

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
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();

  const [step, setStep] = useState<"details" | "media" | "package" | "review">(
    "details"
  );
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    city_id: "",
    media_urls: [""],
  });

  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usingFallbackOptions, setUsingFallbackOptions] = useState(false);
  const [dbOptionsError, setDbOptionsError] = useState<string | null>(null);

  const fallbackCategories: Category[] = [
    { id: "fallback-electronics", name: "Electronics" },
    { id: "fallback-vehicles", name: "Vehicles" },
    { id: "fallback-properties", name: "Properties" },
  ];

  const fallbackCities: City[] = [
    { id: "fallback-karachi", name: "Karachi" },
    { id: "fallback-lahore", name: "Lahore" },
    { id: "fallback-islamabad", name: "Islamabad" },
  ];

  const fallbackPackages: Package[] = [
    {
      id: "fallback-basic",
      name: "Basic",
      duration_days: 7,
      price: 1999,
      is_featured: false,
    },
    {
      id: "fallback-standard",
      name: "Standard",
      duration_days: 15,
      price: 3999,
      is_featured: false,
    },
    {
      id: "fallback-premium",
      name: "Premium",
      duration_days: 30,
      price: 6999,
      is_featured: true,
    },
  ];

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    void fetchOptions();
  }, [user, authLoading, router]);

  const fetchOptions = async () => {
    try {
      setUsingFallbackOptions(false);
      setDbOptionsError(null);
      setSelectedPackage("");

      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (catError) {
        setCategories(fallbackCategories);
        setUsingFallbackOptions(true);
        setDbOptionsError(catError.message);
      } else if (catData && catData.length > 0) {
        setCategories(catData as Category[]);
      } else {
        setCategories(fallbackCategories);
        setUsingFallbackOptions(true);
        setDbOptionsError("No categories were returned from Supabase.");
      }

      const { data: cityData, error: cityError } = await supabase
        .from("cities")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (cityError) {
        setCities(fallbackCities);
        setUsingFallbackOptions(true);
        setDbOptionsError(cityError.message);
      } else if (cityData && cityData.length > 0) {
        setCities(cityData as City[]);
      } else {
        setCities(fallbackCities);
        setUsingFallbackOptions(true);
        setDbOptionsError("No cities were returned from Supabase.");
      }

      const { data: pkgData, error: pkgError } = await supabase
        .from("packages")
        .select("id, name, duration_days, price, is_featured")
        .eq("is_active", true)
        .order("duration_days");

      if (pkgError) {
        setPackages(fallbackPackages);
        setUsingFallbackOptions(true);
        setDbOptionsError(pkgError.message);
      } else if (pkgData && pkgData.length > 0) {
        setPackages(pkgData as Package[]);
      } else {
        setPackages(fallbackPackages);
        setUsingFallbackOptions(true);
        setDbOptionsError("No packages were returned from Supabase.");
      }
    } catch (error) {
      console.error("Failed to fetch options:", error);
      setCategories(fallbackCategories);
      setCities(fallbackCities);
      setPackages(fallbackPackages);
      setUsingFallbackOptions(true);
      setDbOptionsError(
        error instanceof Error ? error.message : "Failed to load DB options."
      );
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === "details") {
      if (!formData.title) newErrors.title = "Title is required";
      if (formData.title.length < 5)
        newErrors.title = "Title must be at least 5 characters";
      if (!formData.description)
        newErrors.description = "Description is required";
      if (formData.description.length < 20)
        newErrors.description = "Description must be at least 20 characters";
      if (!formData.category_id) newErrors.category = "Category is required";
      if (!formData.city_id) newErrors.city = "City is required";
    } else if (step === "media") {
      const validUrls = formData.media_urls.filter((url) => url.trim());
      if (validUrls.length === 0)
        newErrors.media = "At least one media URL is required";
    } else if (step === "package") {
      if (!selectedPackage) newErrors.package = "Please select a package";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (step === "details") setStep("media");
    else if (step === "media") setStep("package");
    else if (step === "package") setStep("review");
  };

  const handleBack = () => {
    if (step === "media") setStep("details");
    else if (step === "package") setStep("media");
    else if (step === "review") setStep("package");
  };

  const handleSubmit = async () => {
    if (!user) {
      setErrors({
        submit:
          "You must be signed in to create a listing. Please sign in again.",
      });
      return;
    }

    setLoading(true);
    try {
      if (usingFallbackOptions) {
        throw new Error(
          dbOptionsError ||
            "Database options are not loaded yet. Please ensure Supabase seed data is present."
        );
      }

      const mediaUrls = formData.media_urls.filter((url) => url.trim());

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(
          "Your session has expired. Please sign in again before creating a listing."
        );
      }

      const accessToken = sessionData.session.access_token;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL is not configured.");
      }

      const createResponse = await fetch(`${apiUrl}/api/v1/ads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id,
          city_id: formData.city_id,
          media_urls: mediaUrls,
        }),
      });

      const createJson = await createResponse.json();
      if (!createResponse.ok || !createJson?.data?.id) {
        throw new Error(createJson?.error?.message || "Failed to create ad");
      }

      const adId: string = createJson.data.id;

      if (selectedPackage) {
        const packageResponse = await fetch(
          `${apiUrl}/api/v1/ads/${adId}/select-package`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ package_id: selectedPackage }),
          }
        );

        const packageJson = await packageResponse.json();
        if (!packageResponse.ok) {
          throw new Error(
            packageJson?.error?.message ||
              "Ad created but failed to apply package."
          );
        }
      }

      router.push("/dashboard?success=Ad created successfully!");
    } catch (error) {
      console.error("Error:", error);
      setErrors({
        submit:
          error instanceof Error ? error.message : "Failed to create ad",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMediaUrl = () => {
    setFormData((prev) => ({
      ...prev,
      media_urls: [...prev.media_urls, ""],
    }));
  };

  const removeMediaUrl = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      media_urls: prev.media_urls.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
            Create New Listing
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Step {step === "details" ? 1 : step === "media" ? 2 : step === "package" ? 3 : 4} of
            4
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-zinc-200 bg-white/80">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            {["details", "media", "package", "review"].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition ${
                  s === step ||
                  ["details", "media", "package", "review"].indexOf(s) <
                    ["details", "media", "package", "review"].indexOf(step)
                    ? "bg-blue-600"
                    : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {usingFallbackOptions ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm space-y-3">
            <div>
              Categories/Cities/Packages are using fallback demo options because the API returned no
              data.
            </div>
            {dbOptionsError ? (
              <div className="text-amber-700/90">{dbOptionsError}</div>
            ) : null}
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={fetchOptions}
                className="px-4 py-2 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-900 border border-amber-300 transition"
              >
                Retry loading options
              </button>
              <div className="text-amber-700/90">
                Tip: run `001_init_schema.sql` + `002_seed_dummy_data.sql` in Supabase SQL Editor for
                the same project as your backend.
              </div>
            </div>
          </div>
        ) : null}

        {/* Step 1: Details */}
        {step === "details" && (
          <div className="space-y-6">
            <div>
              <label className="block text-zinc-800 font-medium mb-2">
                Listing Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., iPhone 13 Pro, 256GB"
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="text-rose-600 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-zinc-800 font-medium mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe your item in detail..."
                rows={6}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {errors.description && (
                <p className="text-rose-600 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-800 font-medium mb-2">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, category_id: e.target.value }))
                  }
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-rose-600 text-sm mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-zinc-800 font-medium mb-2">
                  City *
                </label>
                <select
                  value={formData.city_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city_id: e.target.value }))
                  }
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-rose-600 text-sm mt-1">{errors.city}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Media URLs */}
        {step === "media" && (
          <div className="space-y-6">
            <div>
              <label className="block text-zinc-800 font-medium mb-4">
                Media URLs *
              </label>
              <p className="text-zinc-500 text-sm mb-4">
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
                        setFormData((prev) => ({ ...prev, media_urls: newUrls }));
                      }}
                      placeholder={`URL ${index + 1} (e.g., https://...)`}
                      className="flex-1 bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.media_urls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMediaUrl(index)}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-md text-xs font-medium transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {errors.media && (
                <p className="text-rose-600 text-sm mt-2">{errors.media}</p>
              )}

              <button
                type="button"
                onClick={addMediaUrl}
                className="mt-4 inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 transition"
              >
                + Add Another URL
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-blue-900 text-sm">
                <strong>Tip:</strong> For YouTube videos, paste the full URL (e.g.,
                https://youtube.com/watch?v=...). We'll auto-generate thumbnails.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Package Selection */}
        {step === "package" && (
          <div className="space-y-6">
            <label className="block text-zinc-800 font-medium mb-4">
              Select Package *
            </label>

            <div className="grid gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`border rounded-xl p-6 cursor-pointer transition ${
                    selectedPackage === pkg.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-zinc-200 bg-white hover:border-zinc-400"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">
                        {pkg.name}
                        {pkg.is_featured && (
                          <span className="ml-2 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">
                            FEATURED
                          </span>
                        )}
                      </h3>
                      <p className="text-zinc-500 text-xs mt-1">
                        {pkg.duration_days} days visibility
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-zinc-900">
                        Rs {pkg.price}
                      </p>
                    </div>
                  </div>

                  {selectedPackage === pkg.id && (
                    <div className="mt-4 pt-3 border-t border-blue-100">
                      <p className="text-blue-700 text-xs font-semibold">✓ Selected</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {errors.package && (
              <p className="text-rose-600 text-sm">{errors.package}</p>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                Review Your Listing
              </h2>

              <div className="space-y-4 text-sm text-zinc-700">
                <div>
                  <p className="text-zinc-500 text-xs">Title</p>
                  <p className="text-zinc-900 font-medium">{formData.title}</p>
                </div>

                <div>
                  <p className="text-zinc-500 text-xs">Description</p>
                  <p className="text-zinc-700 whitespace-pre-line">
                    {formData.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-500 text-xs">Category</p>
                    <p className="text-zinc-900 font-medium">
                      {categories.find((c) => c.id === formData.category_id)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">City</p>
                    <p className="text-zinc-900 font-medium">
                      {cities.find((c) => c.id === formData.city_id)?.name}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-zinc-500 text-xs">Media URLs</p>
                  <div className="space-y-1 mt-1 text-xs">
                    {formData.media_urls
                      .filter((url) => url.trim())
                      .map((url, i) => (
                        <p key={i} className="text-blue-600 truncate">
                          {i + 1}. {url}
                        </p>
                      ))}
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-4 mt-4">
                  <p className="text-zinc-500 text-xs">Package</p>
                  <p className="text-zinc-900 font-medium">
                    {packages.find((p) => p.id === selectedPackage)?.name} - Rs{" "}
                    {packages.find((p) => p.id === selectedPackage)?.price}
                  </p>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-800">
                {errors.submit}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-900">
              <strong>Next Step:</strong> After submission, your ad will enter moderation. You'll
              receive a notification once approved.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-10">
          {step !== "details" && (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex-1 border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-50 text-zinc-800 py-3 rounded-lg text-sm font-medium transition"
            >
              ← Back
            </button>
          )}

          {step !== "review" ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-semibold transition"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-semibold transition"
            >
              {loading ? "Creating..." : "Create Listing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
