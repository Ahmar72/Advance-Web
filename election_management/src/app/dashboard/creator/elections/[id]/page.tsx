import { requireRole } from '@/lib/auth';
import { db } from '@/db';
import { elections, polls, candidates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { 
  Users, 
  Calendar, 
  LayoutGrid, 
  UserPlus, 
  Trash2, 
  Globe, 
  FileText,
  AlertCircle,
  Plus
} from 'lucide-react';
import Link from 'next/link';

async function publishElection(id: string) {
  'use server';
  await requireRole(['election_creator', 'super_admin']);
  
  await db.update(elections)
    .set({ status: 'published' })
    .where(eq(elections.id, id));
    
  revalidatePath(`/dashboard/creator/elections/${id}`);
}

async function addCandidate(pollId: string, electionId: string, formData: FormData) {
  'use server';
  await requireRole(['election_creator', 'super_admin']);
  
  const name = formData.get('name') as string;
  const designation = formData.get('designation') as string;
  const manifesto = formData.get('manifesto') as string;
  const photoUrl = formData.get('photoUrl') as string;

  await db.insert(candidates).values({
    pollId,
    name,
    designation,
    manifesto,
    photoUrl,
  });

  revalidatePath(`/dashboard/creator/elections/${electionId}`);
}

export default async function ManageElectionPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = await requireRole(['election_creator', 'super_admin']);
  
  const election = await db.query.elections.findFirst({
    where: and(eq(elections.id, params.id), eq(elections.creatorId, user.id)),
    with: {
      polls: {
        with: {
          candidates: true
        }
      }
    }
  });

  if (!election) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold">{election.title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              election.status === 'published' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
            }`}>
              {election.status}
            </span>
          </div>
          <p className="text-slate-400">{election.category} • Created on {new Date(election.createdAt).toLocaleDateString()}</p>
        </div>

        {election.status === 'draft' && (
          <form action={publishElection.bind(null, election.id)}>
            <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all">
              <Globe className="h-5 w-5" />
              Publish Election
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="p-6 glass-dark rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-400" />
              Schedule
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Registration Deadline</p>
                <p className="text-slate-200 font-medium">{new Date(election.registrationDeadline).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Voting Starts</p>
                <p className="text-slate-200 font-medium">{new Date(election.startDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Voting Ends</p>
                <p className="text-slate-200 font-medium">{new Date(election.endDate).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="p-6 glass-dark rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-400" />
              Voter Limit
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Maximum Allowed</p>
              <p className="text-xl font-bold">{election.maxVoters}</p>
            </div>
          </div>
        </div>

        {/* Main Content: Polls & Candidates */}
        <div className="lg:col-span-2 space-y-8">
          {election.polls.map((poll) => (
            <div key={poll.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                  <LayoutGrid className="h-6 w-6 text-primary-400" />
                  {poll.title}
                </h2>
              </div>

              {/* Candidates List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {poll.candidates.map((candidate) => (
                  <div key={candidate.id} className="p-5 glass-dark rounded-2xl border border-slate-800 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                      {candidate.photoUrl ? (
                         <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <UserPlus className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg truncate">{candidate.name}</h4>
                      <p className="text-sm text-primary-400 font-medium truncate mb-2">{candidate.designation}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{candidate.manifesto}</p>
                    </div>
                  </div>
                ))}

                {/* Add Candidate Card/Form */}
                <div className="p-5 glass-dark rounded-2xl border border-dashed border-slate-800 hover:border-primary-500/50 transition-all">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Candidate
                  </h4>
                  <form action={addCandidate.bind(null, poll.id, election.id)} className="space-y-3">
                    <input name="name" placeholder="Name" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm" required />
                    <input name="designation" placeholder="Designation" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm" required />
                    <textarea name="manifesto" placeholder="Manifesto/Bio" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm h-20" required />
                    <button type="submit" className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-semibold transition-all">
                      Add Candidate
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
