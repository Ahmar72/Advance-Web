'use client';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-zinc-900">Contact</h1>
          <p className="text-sm text-zinc-600 mt-1">Get in touch with the AdFlow Pro team.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-700 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Support</h2>
          <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
            This demo UI doesn’t send emails yet. For now, you can use the information below
            as a placeholder.
          </p>

          <div className="mt-6 space-y-3 text-sm text-zinc-700">
            <div>
              <span className="text-zinc-500">Email: </span>
              support@adflowpro.com
            </div>
            <div>
              <span className="text-zinc-500">Hours: </span>
              Mon - Fri, 9am - 6pm
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs text-zinc-500">
              Tip: connect this page to your notification/email service later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

