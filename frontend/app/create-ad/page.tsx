"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { supabase } from "@/lib/supabase/client";
import {
  getMissingSchemaTable,
  isMissingTableSchemaCacheError,
} from "@/lib/utils/supabase-errors";

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

const FALLBACK_CATEGORIES: Category[] = [
  { id: "fallback-electronics", name: "Electronics" },
  { id: "fallback-vehicles", name: "Vehicles" },
  { id: "fallback-properties", name: "Properties" },
];

const FALLBACK_CITIES: City[] = [
  { id: "fallback-karachi", name: "Karachi" },
  { id: "fallback-lahore", name: "Lahore" },
  { id: "fallback-islamabad", name: "Islamabad" },
];

const FALLBACK_PACKAGES: Package[] = [
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

const slugifyTitle = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

const MAX_MEDIA_URLS = 8;

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isVideoLikeUrl(url: string): boolean {
  if (!isValidHttpUrl(url)) return false;

  const lower = url.toLowerCase();

  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com") ||
    /\.(mp4|mov|webm|mkv|avi)(\?.*)?$/i.test(lower)
  );
}

function isLikelyImageUrl(url: string): boolean {
  if (!isValidHttpUrl(url)) return false;

  if (isVideoLikeUrl(url)) return false;

  if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?.*)?$/i.test(url)) {
    return true;
  }

  // Accept common CDN/image endpoints without extensions.
  return true;
}

export default function CreateAdPage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();

  const [step, setStep] = useState<"details" | "media" | "package" | "review">(
    "details",
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
  const [previewLoadError, setPreviewLoadError] = useState<
    Record<string, boolean>
  >({});

  const fetchOptions = useCallback(async () => {
    try {
      setUsingFallbackOptions(false);
      setDbOptionsError(null);
      setSelectedPackage("");
      const optionErrors: string[] = [];
      const missingTables = new Set<string>();

      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (catError) {
        setCategories(FALLBACK_CATEGORIES);
        setUsingFallbackOptions(true);
        optionErrors.push(catError.message);
        const table = getMissingSchemaTable(catError.message);
        if (table) missingTables.add(table);
      } else if (catData && catData.length > 0) {
        setCategories(catData as Category[]);
      } else {
        setCategories(FALLBACK_CATEGORIES);
        setUsingFallbackOptions(true);
        optionErrors.push("No categories were returned from Supabase.");
      }

      const { data: cityData, error: cityError } = await supabase
        .from("cities")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (cityError) {
        setCities(FALLBACK_CITIES);
        setUsingFallbackOptions(true);
        optionErrors.push(cityError.message);
        const table = getMissingSchemaTable(cityError.message);
        if (table) missingTables.add(table);
      } else if (cityData && cityData.length > 0) {
        setCities(cityData as City[]);
      } else {
        setCities(FALLBACK_CITIES);
        setUsingFallbackOptions(true);
        optionErrors.push("No cities were returned from Supabase.");
      }

      const { data: pkgData, error: pkgError } = await supabase
        .from("packages")
        .select("id, name, duration_days, price, is_featured")
        .eq("is_active", true)
        .order("duration_days");

      if (pkgError) {
        setPackages(FALLBACK_PACKAGES);
        setUsingFallbackOptions(true);
        optionErrors.push(pkgError.message);
        const table = getMissingSchemaTable(pkgError.message);
        if (table) missingTables.add(table);
      } else if (pkgData && pkgData.length > 0) {
        setPackages(pkgData as Package[]);
      } else {
        setPackages(FALLBACK_PACKAGES);
        setUsingFallbackOptions(true);
        optionErrors.push("No packages were returned from Supabase.");
      }

      if (optionErrors.length > 0) {
        const hasMissingTable = optionErrors.some((message) =>
          isMissingTableSchemaCacheError(message),
        );

        if (hasMissingTable && missingTables.size > 0) {
          setDbOptionsError(
            `Missing tables in connected Supabase project: ${Array.from(missingTables).join(", ")}.`,
          );
        } else {
          setDbOptionsError(optionErrors[optionErrors.length - 1]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch options:", error);
      setCategories(FALLBACK_CATEGORIES);
      setCities(FALLBACK_CITIES);
      setPackages(FALLBACK_PACKAGES);
      setUsingFallbackOptions(true);
      setDbOptionsError(
        error instanceof Error ? error.message : "Failed to load DB options.",
      );
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/signin");
      return;
    }

    void fetchOptions();
  }, [authLoading, user, router, fetchOptions]);

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
      const validUrls = formData.media_urls
        .map((url) => url.trim())
        .filter(Boolean);

      if (validUrls.length === 0) {
        newErrors.media = "Please add at least one image URL";
      } else if (validUrls.some((url) => isVideoLikeUrl(url))) {
        newErrors.media =
          "Only image URLs are allowed. Videos are not supported.";
      } else if (validUrls.some((url) => !isLikelyImageUrl(url))) {
        newErrors.media = "Please enter valid image URLs (http/https).";
      }
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
            "Database options are not loaded yet. Please verify your Supabase project schema and tables.",
        );
      }

      const mediaUrls = formData.media_urls
        .map((url) => url.trim())
        .filter(Boolean);

      if (mediaUrls.length === 0) {
        throw new Error("At least one image URL is required.");
      }

      if (mediaUrls.some((url) => isVideoLikeUrl(url))) {
        throw new Error(
          "Video URLs are not allowed. Please provide image URLs only.",
        );
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(
          "Your session has expired. Please sign in again before creating a listing.",
        );
      }

      if (!sessionData.session.access_token) {
        throw new Error("Missing access token. Please sign in again.");
      }

      const slugBase = slugifyTitle(formData.title);
      const slug = `${slugBase}-${Date.now().toString(36)}`;

      const { data: createdAd, error: createError } = await supabase
        .from("ads")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id,
          city_id: formData.city_id,
          slug,
          package_id: selectedPackage,
          status: "under_review",
        })
        .select("id")
        .single();

      if (createError || !createdAd?.id) {
        throw new Error(createError?.message || "Failed to create ad");
      }

      const adId = createdAd.id as string;

      if (mediaUrls.length > 0) {
        const mediaPayload = mediaUrls.map((url) => ({
          ad_id: adId,
          original_url: url,
          source_type: "external",
          validation_status: "pending",
        }));

        const { error: mediaError } = await supabase
          .from("ad_media")
          .insert(mediaPayload);

        if (mediaError) {
          throw new Error(mediaError.message);
        }
      }

      router.push("/dashboard?success=Ad created successfully!");
    } catch (error) {
      console.error("Error:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Failed to create ad",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMediaUrl = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      media_urls: prev.media_urls.filter((_, i) => i !== index),
    }));
  };

  const addMediaUrl = () => {
    setFormData((prev) => ({
      ...prev,
      media_urls: [...prev.media_urls, ""].slice(0, MAX_MEDIA_URLS),
    }));
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">
            Create New Listing
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Step{" "}
            {step === "details"
              ? 1
              : step === "media"
                ? 2
                : step === "package"
                  ? 3
                  : 4}{" "}
            of 4
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
              Categories/Cities/Packages are using fallback demo options because
              Supabase returned no usable data.
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
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your item in detail..."
                rows={6}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {errors.description && (
                <p className="text-rose-600 text-sm mt-1">
                  {errors.description}
                </p>
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
                    setFormData((prev) => ({
                      ...prev,
                      category_id: e.target.value,
                    }))
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
                  <p className="text-rose-600 text-sm mt-1">
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-800 font-medium mb-2">
                  City *
                </label>
                <select
                  value={formData.city_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      city_id: e.target.value,
                    }))
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

        {/* Step 2: Image URLs */}
        {step === "media" && (
          <div className="space-y-6">
            <div>
              <label className="block text-zinc-800 font-medium mb-4">
                Image URLs *
              </label>
              <p className="text-zinc-500 text-sm mb-4">
                Add public image URLs only (max {MAX_MEDIA_URLS}). Video URLs
                are not allowed.
              </p>

              <div className="space-y-3">
                {formData.media_urls.map((url, index) => {
                  const key = `${index}-${url}`;
                  const failed = previewLoadError[key] === true;
                  const canPreview =
                    isLikelyImageUrl(url.trim()) && url.trim() !== "";

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2"
                    >
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const nextUrls = [...formData.media_urls];
                          nextUrls[index] = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            media_urls: nextUrls,
                          }));
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      {canPreview && !failed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url.trim()}
                          alt={`Image preview ${index + 1}`}
                          className="w-full h-36 object-cover rounded-md border border-zinc-200"
                          onError={() =>
                            setPreviewLoadError((prev) => ({
                              ...prev,
                              [key]: true,
                            }))
                          }
                        />
                      ) : url.trim() ? (
                        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                          Preview unavailable for this URL.
                        </div>
                      ) : null}

                      {formData.media_urls.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeMediaUrl(index)}
                          className="text-[11px] font-medium text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addMediaUrl}
                disabled={formData.media_urls.length >= MAX_MEDIA_URLS}
                className="mt-4 inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 transition"
              >
                + Add Another URL
              </button>

              {errors.media && (
                <p className="text-rose-600 text-sm mt-2">{errors.media}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-blue-900 text-sm">
                <strong>Tip:</strong> Use direct image links (jpg, png, webp,
                etc.) that are publicly accessible.
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
                      <p className="text-blue-700 text-xs font-semibold">
                        ✓ Selected
                      </p>
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
                      {
                        categories.find((c) => c.id === formData.category_id)
                          ?.name
                      }
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
                  <p className="text-zinc-500 text-xs">Image URLs</p>
                  <div className="space-y-3 mt-2">
                    {formData.media_urls
                      .map((url) => url.trim())
                      .filter(Boolean)
                      .map((url, i) => (
                        <div
                          key={`${url}-${i}`}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                        >
                          <div className="text-[11px] font-medium text-zinc-500 mb-2">
                            Image {i + 1}
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Review image ${i + 1}`}
                            className="w-full max-h-48 object-cover rounded-md border border-zinc-200"
                          />
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block text-xs text-blue-600 hover:underline truncate"
                          >
                            {url}
                          </a>
                        </div>
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
              <strong>Next Step:</strong> After submission, your ad will enter
              moderation. You&apos;ll receive a notification once approved.
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
