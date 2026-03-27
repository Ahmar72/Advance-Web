'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-slate-400 mt-1">Placeholder privacy policy for the demo.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 text-slate-200 space-y-6">
        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xl font-semibold text-white">What we store</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">
            This project stores ad details, status history, and payment metadata in Supabase.
            Media is referenced via external URLs rather than uploaded to the server.
          </p>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xl font-semibold text-white">How we use it</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">
            Data is used to run the workflow: moderation, payment verification, publishing,
            expiry, and system health monitoring.
          </p>
        </section>
      </div>
    </div>
  );
}

