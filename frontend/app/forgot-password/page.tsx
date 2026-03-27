'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
          <p className="text-slate-400 mt-1">
            This project uses GitHub OAuth, so there is no password to reset.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-200">
          <div className="font-semibold text-white">Need to sign in again?</div>
          <Link
            href="/signin"
            className="inline-block mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

