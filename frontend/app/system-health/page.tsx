'use client';

import { useState } from 'react';

export default function SystemHealthPage() {
  const [status, setStatus] = useState<string>('Not checked yet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cron/health`);
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);

      const json = await res.json();
      setStatus(json.message || 'Health check passed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check health');
      setStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-zinc-900">System Health</h1>
          <p className="text-sm text-zinc-600 mt-1">DB heartbeat and cron health checks.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Current status</div>
          <div className="text-xl font-semibold text-zinc-900 mt-2">{status}</div>

          {error ? (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
              {error}
            </div>
          ) : null}

          <button
            onClick={checkHealth}
            disabled={loading}
            className="mt-6 w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Run Health Check'}
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-zinc-700 text-sm leading-relaxed shadow-sm">
          This calls the backend cron health endpoint (`/api/v1/cron/health`) which triggers a DB heartbeat
          and logs the result into `system_health_logs`.
        </div>
      </div>
    </div>
  );
}

