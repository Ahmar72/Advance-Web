import { db } from '@/db';
import { elections, registrations, votes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ShieldCheck, Info, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

async function castVote(electionId: string, pollId: string, formData: FormData) {
  'use server';
  const user = await requireAuth();
  
  const secretId = formData.get('secretId') as string;
  const candidateId = formData.get('candidateId') as string;

  // 1. Validate Secret ID and registration
  const registration = await db.query.registrations.findFirst({
    where: and(
      eq(registrations.pollId, pollId),
      eq(registrations.userId, user.id),
      eq(registrations.secretId, secretId)
    )
  });

  if (!registration || registration.status === 'voted') {
    throw new Error('Invalid Secret ID or you have already voted.');
  }

  // 2. Mark registration as voted (prevent double voting)
  await db.update(registrations)
    .set({ status: 'voted' })
    .where(eq(registrations.id, registration.id));

  // 3. Cast the anonymous vote
  await db.insert(votes).values({
    pollId,
    candidateId,
  });

  revalidatePath(`/elections/${electionId}`);
  revalidatePath(`/elections/${electionId}/results`);
  redirect(`/elections/${electionId}/success`);
}

export default async function VotePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  
  const election = await db.query.elections.findFirst({
    where: eq(elections.id, params.id),
    with: {
      polls: {
        with: {
          candidates: true
        }
      }
    }
  });

  if (!election || election.status !== 'published') notFound();

  // Check if active
  const now = new Date();
  if (now < new Date(election.startDate) || now > new Date(election.endDate)) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto p-8 glass-dark rounded-3xl border border-amber-500/20 bg-amber-500/5 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-bold">Election Not Active</h2>
          <p className="text-slate-400">
            Voting is only available between {new Date(election.startDate).toLocaleString()} and {new Date(election.endDate).toLocaleString()}.
          </p>
        </div>
      </div>
    );
  }

  const poll = election.polls[0];
  const registration = await db.query.registrations.findFirst({
    where: and(eq(registrations.pollId, poll.id), eq(registrations.userId, user.id))
  });

  if (!registration) {
     return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto p-8 glass-dark rounded-3xl border border-rose-500/20 bg-rose-500/5 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto" />
          <h2 className="text-2xl font-bold">Not Registered</h2>
          <p className="text-slate-400">You must be registered to participate in this election.</p>
          <Link href={`/elections/${election.id}`} className="block w-full py-3 bg-slate-900 rounded-xl font-semibold">Back to Info</Link>
        </div>
      </div>
    );
  }

  if (registration.status === 'voted') {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto p-8 glass-dark rounded-3xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-bold">Vote Already Cast</h2>
          <p className="text-slate-400">Your vote for this election has already been securely recorded. Thank you for participating!</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-display font-bold">Cast Your Vote</h1>
            <p className="text-slate-400">Please enter your Secret ID and select one candidate.</p>
          </div>

          <form action={castVote.bind(null, election.id, poll.id)} className="space-y-12">
            <div className="p-8 glass-dark rounded-3xl border border-slate-800 space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-400" />
                Voter Verification
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Enter Secret ID</label>
                <input 
                  name="secretId"
                  type="text" 
                  placeholder="POLL-XXXX-XXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xl font-mono tracking-widest focus:ring-2 focus:ring-primary-500 transition-all uppercase"
                  required
                />
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Your secret ID was sent to your email upon registration.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Select Candidate</h3>
              <div className="grid grid-cols-1 gap-4">
                {poll.candidates.map((candidate) => (
                  <label key={candidate.id} className="relative group cursor-pointer">
                    <input type="radio" name="candidateId" value={candidate.id} className="peer sr-only" required />
                    <div className="p-6 glass-dark rounded-3xl border border-slate-800 peer-checked:border-primary-500 peer-checked:bg-primary-500/5 transition-all flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden">
                         {candidate.photoUrl ? (
                           <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-2xl">{candidate.name[0]}</div>
                         )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{candidate.name}</h4>
                        <p className="text-slate-400 text-sm">{candidate.designation}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-slate-800 peer-checked:border-primary-500 peer-checked:bg-primary-500 flex items-center justify-center transition-all">
                        <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center gap-3 group"
            >
              Submit Anonymous Vote
              <ShieldCheck className="h-6 w-6 group-hover:scale-110 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

