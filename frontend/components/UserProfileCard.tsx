"use client";

import { User } from "@/lib/AuthContext";
import Link from "next/link";

interface UserProfileCardProps {
  user: User;
  onSignOut?: () => void;
}

export function UserProfileCard({ user, onSignOut }: UserProfileCardProps) {
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-24"></div>

      <div className="px-6 py-6 space-y-4">
        {/* Avatar & Name */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg -mt-8 border-4 border-white dark:border-zinc-950">
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              GitHub User
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* User Info */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Email
            </p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 break-all">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              User ID
            </p>
            <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400 break-all">
              {user.id.slice(0, 16)}...
            </p>
          </div>

          {user.user_metadata?.user_name && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                GitHub Username
              </p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                @{user.user_metadata.user_name}
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/settings"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            View Settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
