"use client";

import { User } from "@/lib/AuthContext";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface UserProfileCardProps {
  user: User;
  onSignOut?: () => void;
}

export function UserProfileCard({ user, onSignOut }: UserProfileCardProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("aw-dashboard-avatar");
    if (stored) {
      setAvatarUrl(stored);
    }
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        setAvatarUrl(result);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("aw-dashboard-avatar", result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl bg-white border border-zinc-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-24"></div>

      <div className="px-6 py-6 space-y-4">
        {/* Avatar & Name */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl -mt-10 border-4 border-white shadow-sm overflow-hidden group"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user.email?.[0]?.toUpperCase() || "U"}</span>
              )}
              <span className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-medium tracking-wide">
                Change
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-base font-medium text-zinc-700">
              GitHub User
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* User Info */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Email
            </p>
            <p className="text-base font-semibold text-zinc-900 break-all">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              User ID
            </p>
            <p className="text-sm font-mono text-zinc-700 break-all">
              {user.id.slice(0, 16)}...
            </p>
          </div>

          {user.user_metadata?.user_name && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                GitHub Username
              </p>
              <p className="text-base font-semibold text-zinc-900">
                @{user.user_metadata.user_name}
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="pt-4 border-t border-zinc-200">
          <Link
            href="/settings"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View Settings →
          </Link>
        </div>
      </div>
    </div>
  );
}
