'use client';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Contact</h1>
          <p className="text-slate-400 mt-1">Get in touch with the AdFlow Pro team.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-slate-200">
          <h2 className="text-xl font-semibold text-white">Support</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">
            This demo UI doesn’t send emails yet. For now, you can use the information below
            as a placeholder.
          </p>

          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div>
              <span className="text-slate-400">Email: </span>
              support@adflowpro.com
            </div>
            <div>
              <span className="text-slate-400">Hours: </span>
              Mon - Fri, 9am - 6pm
            </div>
          </div>

          <div className="mt-8">
            <p className="text-slate-400 text-xs">
              Tip: connect this page to your notification/email service later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

