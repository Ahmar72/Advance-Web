import { requireRole } from '@/lib/auth';
import { db } from '@/db';
import { elections } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Plus, LayoutGrid, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default async function CreatorDashboardPage() {
  const { user } = await requireRole(['election_creator', 'super_admin']);

  const myElections = await db.query.elections.findMany({
    where: eq(elections.creatorId, user.id),
    orderBy: [desc(elections.createdAt)],
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold">My Elections</h1>
          <p className="text-slate-400">Manage your hosted elections and view results.</p>
        </div>
        <Link
          href="/dashboard/creator/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/20 transition-all"
        >
          <Plus className="h-5 w-5" />
          Create New Election
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myElections.length === 0 ? (
          <div className="md:col-span-3 p-12 glass-dark rounded-3xl border border-dashed border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-600">
              <LayoutGrid className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No elections yet</h3>
              <p className="text-slate-500">You haven't created any elections. Click the button above to get started.</p>
            </div>
          </div>
        ) : (
          myElections.map((election) => (
            <div key={election.id} className="p-6 glass-dark rounded-3xl border border-slate-800 hover:border-primary-500/30 transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                    election.status === 'published' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {election.status}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(election.createdAt).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-xl font-display font-bold group-hover:text-primary-400 transition-colors">{election.title}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span>Starts: {new Date(election.startDate).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="h-4 w-4" />
                    <span>Max Voters: {election.maxVoters}</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <Link
                    href={`/dashboard/creator/elections/${election.id}`}
                    className="flex-1 text-center py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/dashboard/creator/elections/${election.id}/results`}
                    className="flex-1 text-center py-2 bg-primary-600/10 hover:bg-primary-600/20 text-primary-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    Results
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

