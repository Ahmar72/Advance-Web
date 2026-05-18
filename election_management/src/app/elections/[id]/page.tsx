import { db } from '@/db';
import { elections, registrations } from '@/db/schema';
import { eq, count, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  ShieldCheck, 
  Timer, 
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { requireAuth, getProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

async function joinElection(electionId: string, pollId: string) {
  'use server';
  const user = await requireAuth();
  
  // 1. Check if already registered
  const existing = await db.query.registrations.findFirst({
    where: and(eq(registrations.pollId, pollId), eq(registrations.userId, user.id))
  });
  
  if (existing) return;

  // 2. Check if limit reached
  const election = await db.query.elections.findFirst({
    where: eq(elections.id, electionId)
  });
  
  if (!election) return;

  const currentVoters = await db.select({ value: count() }).from(registrations).where(eq(registrations.pollId, pollId));
  
  if (currentVoters[0].value >= election.maxVoters) {
    return;
  }

  // 3. Generate Secret ID (Simulated)
  const secretId = `POLL-${pollId.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // 4. Register
  await db.insert(registrations).values({
    pollId,
    userId: user.id,
    secretId,
    status: 'registered',
  });

  revalidatePath(`/elections/${electionId}`);
}

export default async function PublicElectionDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const election = await db.query.elections.findFirst({
    where: eq(elections.id, params.id),
    with: {
      polls: {
        with: {
          candidates: true
        }
      },
      creator: true
    }
  });

  if (!election) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  
  const isRegistered = userId ? await db.query.registrations.findFirst({
    where: and(eq(registrations.pollId, election.polls[0]?.id), eq(registrations.userId, userId))
  }) : null;

  const voterCount = await db.select({ value: count() }).from(registrations).where(eq(registrations.pollId, election.polls[0]?.id));
  const isFull = voterCount[0].value >= election.maxVoters;

  return (
    <main className="flex-1 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-bold uppercase tracking-wider">
                  {election.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  election.status === 'published' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                }`}>
                  {election.status}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">{election.title}</h1>
              <p className="text-xl text-slate-400 leading-relaxed">{election.description}</p>
              
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Deadline</p>
                    <p className="font-semibold">{new Date(election.registrationDeadline).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Capacity</p>
                    <p className="font-semibold">{voterCount[0].value} / {election.maxVoters}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 glass-dark rounded-3xl p-8 border border-slate-800 space-y-6">
              <h3 className="text-xl font-display font-bold">Registration</h3>
              
              {isRegistered ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                    <p className="font-medium">You are registered!</p>
                  </div>
                  <p className="text-sm text-slate-400">
                    Check your email for your unique Secret ID. You will need it to cast your vote once the election starts.
                  </p>
                </div>
              ) : isFull ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400">
                  <Lock className="h-6 w-6" />
                  <p className="font-medium">Poll is Full</p>
                </div>
              ) : (
                <form action={joinElection.bind(null, election.id, election.polls[0]?.id)}>
                  <button className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 group">
                    I Want to Participate
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-4">
                    By joining, you agree to the voting terms and privacy policy.
                  </p>
                </form>
              )}
            </div>
          </div>

          <hr className="border-slate-900" />

          {/* Candidates Section */}
          <div className="space-y-8">
            <h2 className="text-3xl font-display font-bold">Candidates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {election.polls[0]?.candidates.map((candidate) => (
                <div key={candidate.id} className="glass-dark rounded-3xl border border-slate-800 overflow-hidden group">
                  <div className="h-48 bg-slate-900 relative overflow-hidden">
                    {candidate.photoUrl ? (
                      <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Users className="h-16 w-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60"></div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="text-xl font-bold">{candidate.name}</h4>
                      <p className="text-primary-400 font-medium text-sm">{candidate.designation}</p>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{candidate.manifesto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
