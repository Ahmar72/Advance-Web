'use client';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-zinc-900">FAQ</h1>
          <p className="text-sm text-zinc-600 mt-1">Answers to common questions about AdFlow Pro.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-zinc-700">
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">How do packages work?</h2>
          <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
            Packages control how long your listing stays active, how it is ranked in public results,
            and whether it gets featured placement.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">What is the moderation process?</h2>
          <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
            After you submit your ad, a moderator reviews the content for quality and policy fit.
            Approved ads move to the payment verification stage.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Do you store images locally?</h2>
          <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
            No. Ad media is stored as external URLs only, and thumbnail/preview is normalized at runtime.
          </p>
        </section>
      </div>
    </div>
  );
}

