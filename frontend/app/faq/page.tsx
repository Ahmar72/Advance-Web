'use client';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">FAQ</h1>
          <p className="text-slate-400 mt-1">Answers to common questions about AdFlow Pro.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-slate-200">
        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xl font-semibold text-white">How do packages work?</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">
            Packages control how long your listing stays active, how it is ranked in public results,
            and whether it gets featured placement.
          </p>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xl font-semibold text-white">What is the moderation process?</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">
            After you submit your ad, a moderator reviews the content for quality and policy fit.
            Approved ads move to the payment verification stage.
          </p>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xl font-semibold text-white">Do you store images locally?</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">
            No. Ad media is stored as external URLs only, and thumbnail/preview is normalized at runtime.
          </p>
        </section>
      </div>
    </div>
  );
}

