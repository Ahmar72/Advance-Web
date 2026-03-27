'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function SettingsPage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/signin');
  }, [isLoading, user, router]);

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      router.push('/signin');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-base text-zinc-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Account details and basic actions.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Email
              </div>
              <div className="text-sm font-medium text-zinc-900 break-all">
                {user.email}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                User ID
              </div>
              <div className="text-sm font-mono text-zinc-600 break-all">
                {user.id}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Role
              </div>
              <div className="text-sm font-medium text-zinc-900">
                {user.role || 'unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Admin login / panel access */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-zinc-900 shadow-sm flex flex-col gap-3">
          <div>
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Admin Panel
            </div>
            <p className="text-sm text-blue-900 mt-1">
              Use this button to open the admin dashboard if your account has admin access.
            </p>
          </div>
          <button
            onClick={() => {
              if (user.role === 'admin' || user.role === 'super_admin') {
                router.push('/admin/dashboard');
              } else {
                alert('This account is not an admin. Please use an admin account to access the admin panel.');
              }
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            Login as admin
          </button>
          <p className="text-xs text-blue-900/80">
            Note: Admin login uses the same GitHub account; only users with role <code>admin</code> or <code>super_admin</code> can access the panel.
          </p>
        </div>

        {/* Moderator login / moderation panel access */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-zinc-900 shadow-sm flex flex-col gap-3">
          <div>
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Moderation Panel
            </div>
            <p className="text-sm text-emerald-900 mt-1">
              Open the moderator queue to review ads for content quality and policy fit.
            </p>
          </div>
          <button
            onClick={() => {
              if (
                user.role === 'moderator' ||
                user.role === 'admin' ||
                user.role === 'super_admin'
              ) {
                router.push('/moderator/queue');
              } else {
                alert('This account is not a moderator. Please use a moderator or admin account to access the moderation panel.');
              }
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            Moderator
          </button>
          <p className="text-xs text-emerald-900/80">
            Note: Moderation access is available for users with role <code>moderator</code>, <code>admin</code>, or <code>super_admin</code>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm md:text-base font-semibold rounded-lg disabled:opacity-50 shadow-sm transition"
          >
            {busy ? 'Signing out...' : 'Sign Out'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-3 bg-white hover:bg-zinc-50 text-zinc-800 text-sm md:text-base font-semibold rounded-lg border border-zinc-300 shadow-sm transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

