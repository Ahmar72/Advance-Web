"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { UserProfileCard } from "@/components/UserProfileCard";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/signin");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-8 w-8 animate-spin text-zinc-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          <p className="text-sm text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-zinc-50 to-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.914 1.209.092-.937.35-1.546.636-1.903-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.819c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.375.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              My Listings
            </Link>
            <Link
              href="/create-ad"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              Post Ad
            </Link>
            <Link
              href="/settings"
              className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Settings
            </Link>
            {(user.role === "moderator" || user.role === "admin" || user.role === "super_admin") && (
              <Link
                href="/moderator/queue"
                className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Moderator
              </Link>
            )}
            {(user.role === "admin" || user.role === "super_admin") && (
              <Link
                href="/admin/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                Welcome{user.user_metadata?.user_name ? `, @${user.user_metadata.user_name}` : ""}
              </h2>
              <p className="text-lg text-zinc-600">
                You are successfully authenticated with GitHub
              </p>
            </div>

            {/* Profile Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Profile Card */}
              <div className="md:col-span-2">
                <UserProfileCard user={user} onSignOut={signOut} />
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="rounded-xl bg-white border border-zinc-200 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      Account Status
                    </p>
                    <p className="text-sm font-medium text-green-600 flex items-center gap-2 mt-1">
                      <span className="h-2 w-2 rounded-full bg-green-600"></span>
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
