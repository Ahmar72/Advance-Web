import { requireRole } from '@/lib/auth';
import { db } from '@/db';
import { elections, polls } from '@/db/schema';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Calendar, Users, Info, ArrowRight, LayoutGrid } from 'lucide-react';

async function createElection(formData: FormData) {
  'use server';
  const { user } = await requireRole(['election_creator', 'super_admin']);

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const startDate = new Date(formData.get('startDate') as string);
  const endDate = new Date(formData.get('endDate') as string);
  const registrationDeadline = new Date(formData.get('registrationDeadline') as string);
  const maxVoters = parseInt(formData.get('maxVoters') as string);
  const pollTitle = formData.get('pollTitle') as string;

  // 1. Create the election
  const [newElection] = await db.insert(elections).values({
    creatorId: user.id,
    title,
    description,
    category,
    startDate,
    endDate,
    registrationDeadline,
    maxVoters,
    status: 'draft',
  }).returning();

  // 2. Create the initial poll
  await db.insert(polls).values({
    electionId: newElection.id,
    title: pollTitle || 'Main Poll',
  });

  revalidatePath('/dashboard/creator');
  redirect(`/dashboard/creator/elections/${newElection.id}`);
}

export default async function NewElectionPage() {
  await requireRole(['election_creator', 'super_admin']);

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold">Create New Election</h1>
        <p className="text-slate-400">Set up your election details and initial poll.</p>
      </div>

      <div className="p-8 glass-dark rounded-3xl border border-slate-800">
        <form action={createElection} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-primary-400" />
              General Information
            </h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Election Title</label>
              <input 
                name="title"
                type="text" 
                placeholder="e.g. Annual Board Election 2026"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Category</label>
                <select 
                  name="category"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 transition-all"
                  required
                >
                  <option value="Corporate">Corporate</option>
                  <option value="Educational">Educational</option>
                  <option value="Government">Government</option>
                  <option value="Non-Profit">Non-Profit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Max Voters</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input 
                    name="maxVoters"
                    type="number" 
                    placeholder="1000"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary-500 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Description</label>
              <textarea 
                name="description"
                placeholder="Detailed description of the election purpose and rules..."
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 h-32 focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                required
              ></textarea>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-400" />
              Election Schedule
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Registration Deadline</label>
                <input 
                  name="registrationDeadline"
                  type="datetime-local" 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Start Date & Time</label>
                <input 
                  name="startDate"
                  type="datetime-local" 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">End Date & Time</label>
                <input 
                  name="endDate"
                  type="datetime-local" 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Poll Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary-400" />
              Initial Poll
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Poll Title</label>
              <input 
                name="pollTitle"
                type="text" 
                placeholder="e.g. Presidential Candidates"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            Create Election & Continue
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}

