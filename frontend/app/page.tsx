"use client";

import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

type HomeAd = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  category?: { name: string } | null;
  city?: { name: string } | null;
  package?: { name: string; price: number; is_featured?: boolean } | null;
  media?: Array<{ thumbnail_url: string | null; original_url: string }>;
  seller?: { full_name: string | null; email: string } | null;
};

type LearningQuestion = {
  question: string;
  answer: string;
  topic: string | null;
  difficulty: string;
};

type HomeAdRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  category: { name: string } | { name: string }[] | null;
  city: { name: string } | { name: string }[] | null;
  package:
    | { name: string; price: number; is_featured?: boolean }
    | { name: string; price: number; is_featured?: boolean }[]
    | null;
  media: Array<{ thumbnail_url: string | null; original_url: string }> | null;
  seller:
    | { full_name: string | null; email: string }
    | { full_name: string | null; email: string }[]
    | null;
};

export default function HomePage() {
  const { user } = useAuth();

  const [featuredAds, setFeaturedAds] = useState<HomeAd[]>([]);
  const [recentAds, setRecentAds] = useState<HomeAd[]>([]);
  const [learningQuestion, setLearningQuestion] =
    useState<LearningQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const fetchHomeAds = async () => {
      try {
        const { data, error } = await supabase
          .from("ads")
          .select(
            "id, title, description, status, created_at, category:categories(name), city:cities(name), package:packages(name, price, is_featured), media:ad_media(thumbnail_url, original_url), seller:users(full_name, email)",
          )
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(30);

        if (error || !data) return;

        const rows = (data || []) as unknown as HomeAdRow[];
        const ads: HomeAd[] = rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          created_at: row.created_at,
          category: Array.isArray(row.category)
            ? row.category[0]
            : row.category,
          city: Array.isArray(row.city) ? row.city[0] : row.city,
          package: Array.isArray(row.package) ? row.package[0] : row.package,
          media: row.media || [],
          seller: Array.isArray(row.seller) ? row.seller[0] : row.seller,
        }));
        setFeaturedAds(
          ads.filter((a) => Boolean(a.package?.is_featured)).slice(0, 6),
        );
        setRecentAds(ads.slice(0, 6));
      } catch {
        // Keep home page usable even if ads fail.
      }
    };

    const fetchLearningQuestion = async () => {
      try {
        const ordered = await supabase
          .from("questions")
          .select("question, answer, topic, difficulty")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!ordered.error && ordered.data) {
          setLearningQuestion(ordered.data as LearningQuestion);
          return;
        }

        const fallback = await supabase
          .from("questions")
          .select("question, answer, topic, difficulty")
          .limit(1)
          .maybeSingle();

        if (!fallback.error && fallback.data) {
          setLearningQuestion(fallback.data as LearningQuestion);
        }
      } catch {
        // Ignore widget failure.
      }
    };

    fetchHomeAds();
    fetchLearningQuestion();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-linear-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            AdFlow Pro
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="/explore"
              className="text-zinc-600 hover:text-zinc-900 transition text-sm font-medium"
            >
              Explore Ads
            </Link>
            <Link
              href="/packages"
              className="text-zinc-600 hover:text-zinc-900 transition text-sm font-medium"
            >
              Packages
            </Link>
            {user ? (
              <>
                {user.role === "admin" || user.role === "super_admin" ? (
                  <Link
                    href="/admin/dashboard"
                    className="text-zinc-600 hover:text-zinc-900 transition text-sm font-medium"
                  >
                    Admin Dashboard
                  </Link>
                ) : user.role === "moderator" ? (
                  <Link
                    href="/moderator/queue"
                    className="text-zinc-600 hover:text-zinc-900 transition text-sm font-medium"
                  >
                    Moderator Queue
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="text-zinc-600 hover:text-zinc-900 transition text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                )}

                {user.role === "client" && (
                  <Link
                    href="/create-ad"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                  >
                    Post Ad
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/signin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 mb-6">
          Post Ads, Get Results Faster
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 mb-8 max-w-2xl mx-auto">
          Reach thousands of verified buyers with AdFlow Pro&apos;s trusted
          marketplace. Professional moderation, secure payments, and flexible
          packages.
        </p>
        <div className="flex gap-4 justify-center">
          {user ? (
            <>
              <Link
                href="/create-ad"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-sm md:text-base font-semibold shadow-sm transition"
              >
                Create Your Ad
              </Link>
              <Link
                href="/explore"
                className="bg-white hover:bg-zinc-50 text-zinc-800 px-8 py-3 rounded-lg text-sm md:text-base font-semibold border border-zinc-300 shadow-sm transition"
              >
                Browse Listings
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-sm md:text-base font-semibold shadow-sm transition"
              >
                Get Started Free
              </Link>
              <Link
                href="/explore"
                className="bg-white hover:bg-zinc-50 text-zinc-800 px-8 py-3 rounded-lg text-sm md:text-base font-semibold border border-zinc-300 shadow-sm transition"
              >
                Browse Public Ads
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Key Features */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
        <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-3">
            Fast Publishing
          </h3>
          <p className="text-sm text-zinc-600">
            Get your listing approved and live within hours through our
            professional moderation process.
          </p>
        </div>
        <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-3">
            Secure Payments
          </h3>
          <p className="text-sm text-zinc-600">
            Transparent payment verification and admin approval ensures trust
            and security for all users.
          </p>
        </div>
        <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-3">
            Smart Ranking
          </h3>
          <p className="text-sm text-zinc-600">
            Premium packages and featured listings boost visibility. Newest and
            best ads appear first.
          </p>
        </div>
      </div>

      {/* Trust badges + Learning question */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
            <div className="text-zinc-900 font-semibold text-sm">
              Verified Moderation
            </div>
            <div className="text-zinc-600 text-sm mt-2">
              Ads go live only after review and payment verification.
            </div>
          </div>
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
            <div className="text-zinc-900 font-semibold text-sm">
              Secure Proof
            </div>
            <div className="text-zinc-600 text-sm mt-2">
              Payment proof is verified by admins before publishing.
            </div>
          </div>
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
            <div className="text-zinc-900 font-semibold text-sm">
              Learning Question
            </div>
            <div className="text-zinc-600 text-sm mt-2">
              {learningQuestion ? learningQuestion.question : "Loading..."}
            </div>
            {learningQuestion ? (
              <>
                <button
                  onClick={() => setShowAnswer((s) => !s)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-xs font-semibold shadow-sm"
                >
                  {showAnswer ? "Hide answer" : "Reveal answer"}
                </button>
                {showAnswer ? (
                  <div className="mt-3 text-zinc-700 text-sm leading-relaxed">
                    <div className="text-zinc-500 text-xs">
                      Topic: {learningQuestion.topic || "General"} • Difficulty:{" "}
                      {learningQuestion.difficulty}
                    </div>
                    <div className="mt-2">{learningQuestion.answer}</div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Featured + Recent ads */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900">
              Featured Listings
            </h2>
            <div className="text-zinc-500 text-sm mt-1">
              Ranked and featured based on package strength + freshness.
            </div>
            <div className="mt-6 space-y-4">
              {featuredAds.length === 0 ? (
                <div className="text-zinc-500 text-sm">
                  No featured ads right now.
                </div>
              ) : (
                featuredAds.map((ad) => (
                  <Link
                    key={ad.id}
                    href={`/ads/${ad.id}`}
                    className="block rounded-xl border border-zinc-200 bg-white hover:border-blue-400 hover:shadow-sm transition p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-zinc-900 line-clamp-1">
                          {ad.title}
                        </div>
                        <div className="text-zinc-500 text-xs mt-1">
                          {ad.category?.name || "Category"} •{" "}
                          {ad.city?.name || "City"}
                        </div>
                      </div>
                      <div className="text-blue-600 text-sm font-semibold whitespace-nowrap">
                        {ad.package?.price != null
                          ? `Rs ${Number(ad.package.price).toFixed(2)}`
                          : ""}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
            <h2 className="text-2xl font-bold text-white">Recent Listings</h2>
            <div className="text-slate-400 text-sm mt-1">
              Latest published ads
            </div>
            <div className="mt-6 space-y-4">
              {recentAds.length === 0 ? (
                <div className="text-slate-400 text-sm">
                  No recent ads right now.
                </div>
              ) : (
                recentAds.map((ad) => (
                  <Link
                    key={ad.id}
                    href={`/ads/${ad.id}`}
                    className="block rounded-lg border border-slate-700 bg-slate-900/20 hover:border-blue-500 transition p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-white font-semibold line-clamp-1">
                          {ad.title}
                        </div>
                        <div className="text-slate-400 text-sm mt-1">
                          {ad.category?.name || "Category"} •{" "}
                          {ad.city?.name || "City"}
                        </div>
                      </div>
                      <div className="text-slate-300 text-xs whitespace-nowrap">
                        {ad.created_at
                          ? new Date(ad.created_at).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Packages Preview */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">
          Simple, Transparent Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Basic Package */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-white mb-4">Basic</h3>
            <div className="text-3xl font-bold text-white mb-6">Budget</div>
            <ul className="space-y-3 text-slate-400 mb-8">
              <li className="flex gap-2">
                <span>✓</span> 7 days visibility
              </li>
              <li className="flex gap-2">
                <span>✓</span> Category listing
              </li>
              <li className="flex gap-2">
                <span>✓</span> Basic ranking
              </li>
            </ul>
            <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition">
              Choose Plan
            </button>
          </div>

          {/* Standard Package (Featured) */}
          <div className="bg-linear-to-b from-blue-600 to-blue-700 p-8 rounded-lg border-2 border-blue-400 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-400 text-blue-900 px-4 py-1 rounded-full text-sm font-bold">
              POPULAR
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Standard</h3>
            <div className="text-3xl font-bold text-white mb-6">
              Recommended
            </div>
            <ul className="space-y-3 text-blue-100 mb-8">
              <li className="flex gap-2">
                <span>✓</span> 15 days visibility
              </li>
              <li className="flex gap-2">
                <span>✓</span> Homepage priority
              </li>
              <li className="flex gap-2">
                <span>✓</span> Enhanced ranking
              </li>
            </ul>
            <button className="w-full bg-white hover:bg-blue-50 text-blue-600 py-2 rounded font-semibold transition">
              Choose Plan
            </button>
          </div>

          {/* Premium Package */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-white mb-4">Premium</h3>
            <div className="text-3xl font-bold text-white mb-6">Max Reach</div>
            <ul className="space-y-3 text-slate-400 mb-8">
              <li className="flex gap-2">
                <span>✓</span> 30 days visibility
              </li>
              <li className="flex gap-2">
                <span>✓</span> Featured + Auto-refresh
              </li>
              <li className="flex gap-2">
                <span>✓</span> Top ranking always
              </li>
            </ul>
            <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition">
              Choose Plan
            </button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 py-16 mt-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to List Your Items?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of successful sellers. Start post your first ad
            today.
          </p>
          <Link
            href={user ? "/create-ad" : "/signin"}
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Post Your First Ad
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400">
          <p>&copy; 2026 AdFlow Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
