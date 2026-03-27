'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-zinc-900">Terms of Service</h1>
          <p className="text-sm text-zinc-600 mt-1">Placeholder terms for the demo project.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 text-zinc-700 space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">1. Use of platform</h2>
          <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
            AdFlow Pro is a moderated marketplace. Users must provide accurate information
            and comply with content and payment verification policies.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">2. Moderation</h2>
          <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
            Listings may be approved, rejected, or flagged by moderators. Decisions are
            recorded in the system audit logs and status history.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">3. External media</h2>
          <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
            Media is stored as external URLs only. If a URL can’t be previewed, the UI will
            show a placeholder instead of breaking the page.
          </p>
        </section>
      </div>
    </div>
  );
}

