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
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Account details and basic actions.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-200">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Email
              </div>
              <div className="text-sm font-medium text-white break-all">
                {user.email}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                User ID
              </div>
              <div className="text-sm font-mono text-slate-300 break-all">
                {user.id}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Role
              </div>
              <div className="text-sm font-medium text-white">
                {user.role || 'unknown'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
          >
            {busy ? 'Signing out...' : 'Sign Out'}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

