'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          <p className="text-slate-400 mt-1">Placeholder terms for the demo project.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 text-slate-200 space-y-6">
        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xl font-semibold text-white">1. Use of platform</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">
            AdFlow Pro is a moderated marketplace. Users must provide accurate information
            and comply with content and payment verification policies.
          </p>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xl font-semibold text-white">2. Moderation</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">
            Listings may be approved, rejected, or flagged by moderators. Decisions are
            recorded in the system audit logs and status history.
          </p>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xl font-semibold text-white">3. External media</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">
            Media is stored as external URLs only. If a URL can’t be previewed, the UI will
            show a placeholder instead of breaking the page.
          </p>
        </section>
      </div>
    </div>
  );
}

