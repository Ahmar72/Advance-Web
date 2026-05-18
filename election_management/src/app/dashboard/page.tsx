import { requireAuth, getProfile } from '@/lib/auth';
import { db } from '@/db';
import { elections, registrations } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { Vote, PlusCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);

  // Voter stats
  const joinedPolls = await db
    .select({ value: count() })
    .from(registrations)
    .where(eq(registrations.userId, user.id));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-slate-400">Welcome back, {profile?.fullName}. Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 glass-dark rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400">
              <Vote className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">Joined Polls</p>
          <h3 className="text-3xl font-bold">{joinedPolls[0].value}</h3>
        </div>
        
        {profile?.role === 'election_creator' && (
           <div className="p-6 glass-dark rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <PlusCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">My Elections</p>
            <h3 className="text-3xl font-bold">0</h3>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 glass-dark rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-xl font-display font-semibold">Active Voting</h3>
          <div className="flex items-center justify-center h-40 text-slate-600 italic">
            No active polls found.
          </div>
          <Link 
            href="/"
            className="block w-full text-center py-3 bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors font-medium"
          >
            Browse Elections
          </Link>
        </div>

        {profile?.role === 'voter' && (
          <div className="p-8 glass-dark rounded-3xl border border-primary-500/20 bg-primary-500/5 space-y-4">
            <h3 className="text-xl font-display font-semibold text-primary-400">Become an Election Creator</h3>
            <p className="text-slate-400">
              Want to host your own elections? Submit a request to the administrator to get creator privileges.
            </p>
            <Link 
              href="/dashboard/creator/request"
              className="block w-full text-center py-3 bg-primary-600 hover:bg-primary-500 rounded-xl transition-colors font-semibold"
            >
              Submit Request
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
