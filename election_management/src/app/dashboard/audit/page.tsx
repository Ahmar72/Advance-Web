import { requireRole } from '@/lib/auth';
import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { History, Search, Download, Clock } from 'lucide-react';

export default async function AuditPage() {
  await requireRole(['super_admin']);

  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.timestamp)],
    limit: 100,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold">Audit Logs</h1>
          <p className="text-slate-400">Complete transparency and traceability for every system action.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all border border-slate-800">
          <Download className="h-5 w-5" />
          Export Logs (CSV)
        </button>
      </div>

      <div className="glass-dark rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Target</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-primary-500/10 text-primary-400 text-xs font-bold uppercase tracking-tighter">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                    {log.userId?.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {log.targetType || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">
                    {log.metadata || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
