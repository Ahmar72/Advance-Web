import { db } from '@/db';
import { elections, polls, candidates, votes, registrations } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ResultsChart } from '@/components/results/results-chart';
import { Users, Vote, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';

export default async function ResultsPage({
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
      }
    }
  });

  if (!election) notFound();

  const poll = election.polls[0];
  
  // Fetch actual vote counts
  const voteData = await Promise.all(poll.candidates.map(async (candidate) => {
    const voteCount = await db.select({ value: count() }).from(votes).where(eq(votes.candidateId, candidate.id));
    return {
      name: candidate.name,
      votes: voteCount[0].value,
    };
  }));

  const totalVotes = voteData.reduce((acc, curr) => acc + curr.votes, 0);
  const totalRegistrations = await db.select({ value: count() }).from(registrations).where(eq(registrations.pollId, poll.id));
  const turnout = totalRegistrations[0].value > 0 
    ? Math.round((totalVotes / totalRegistrations[0].value) * 100) 
    : 0;

  return (
    <main className="flex-1 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-display font-bold">Election Results</h1>
              <p className="text-slate-400">{election.title} • Live Statistics</p>
            </div>
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2 text-sm font-bold animate-pulse">
              <ShieldCheck className="h-4 w-4" />
              LIVE COUNTING
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 glass-dark rounded-3xl border border-slate-800 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400 mb-4">
                <Vote className="h-6 w-6" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Total Votes Cast</p>
              <h3 className="text-4xl font-bold font-display">{totalVotes}</h3>
            </div>
            <div className="p-8 glass-dark rounded-3xl border border-slate-800 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Registered Voters</p>
              <h3 className="text-4xl font-bold font-display">{totalRegistrations[0].value}</h3>
            </div>
            <div className="p-8 glass-dark rounded-3xl border border-slate-800 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Turnout Percentage</p>
              <h3 className="text-4xl font-bold font-display">{turnout}%</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 p-8 glass-dark rounded-3xl border border-slate-800 space-y-8">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-6 w-6 text-primary-400" />
                <h3 className="text-xl font-bold font-display">Vote Distribution</h3>
              </div>
              <ResultsChart data={voteData} />
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold font-display">Candidate Standings</h3>
              <div className="space-y-4">
                {voteData.sort((a, b) => b.votes - a.votes).map((candidate, i) => (
                  <div key={candidate.name} className="p-4 glass-dark rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                        {i + 1}
                      </div>
                      <span className="font-semibold">{candidate.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{candidate.votes}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Votes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
