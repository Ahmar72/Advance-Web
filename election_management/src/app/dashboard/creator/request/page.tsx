import { requireAuth, getProfile } from '@/lib/auth';
import { db } from '@/db';
import { electionRequests } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Info, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { revalidatePath } from 'next/cache';

async function submitRequest(formData: FormData) {
  'use server';
  const user = await requireAuth();
  const profile = await getProfile(user.id);

  if (profile?.role !== 'voter') {
     return;
  }

  const purpose = formData.get('purpose') as string;
  const organization = formData.get('organization') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;

  await db.insert(electionRequests).values({
    creatorId: user.id,
    purpose,
    organization,
    email,
    phone,
    status: 'pending',
  });

  revalidatePath('/dashboard');
  redirect('/dashboard/creator/request?success=true');
}

export default async function CreatorRequestPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  
  const existingRequest = await db.query.electionRequests.findFirst({
    where: eq(electionRequests.creatorId, user.id),
    orderBy: [desc(electionRequests.createdAt)],
  });

  if (profile?.role !== 'voter') {
    return (
       <div className="max-w-2xl p-8 glass-dark rounded-3xl border border-emerald-500/20 bg-emerald-500/5 text-center">
         <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
         <h2 className="text-2xl font-bold mb-2">You are a Creator</h2>
         <p className="text-slate-400">You already have the privileges to create and manage elections.</p>
       </div>
    );
  }

  if (existingRequest?.status === 'pending') {
    return (
      <div className="max-w-2xl p-8 glass-dark rounded-3xl border border-primary-500/20 bg-primary-500/5 text-center">
        <Clock className="h-12 w-12 text-primary-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Request Pending</h2>
        <p className="text-slate-400">Your request to become an election creator is being reviewed by our administrators. We'll notify you once it's approved.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold">Become an Election Creator</h1>
        <p className="text-slate-400">Apply for privileges to host and manage your own secure elections.</p>
      </div>

      {searchParams.success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          <p>Your request has been submitted successfully!</p>
        </div>
      )}

      <div className="p-8 glass-dark rounded-3xl border border-slate-800">
        <form action={submitRequest} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Full Name</label>
              <input 
                type="text" 
                defaultValue={profile?.fullName} 
                disabled 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Email Address</label>
              <input 
                name="email"
                type="email" 
                defaultValue={profile?.email} 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Phone Number</label>
              <input 
                name="phone"
                type="tel" 
                defaultValue={profile?.phone || ''} 
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Organization Name</label>
              <input 
                name="organization"
                type="text" 
                defaultValue={profile?.organization || ''} 
                placeholder="e.g. Acme Corp"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Purpose of Election</label>
            <textarea 
              name="purpose"
              placeholder="Briefly describe what kind of elections you plan to host..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 h-32 focus:ring-2 focus:ring-primary-500 transition-all resize-none"
              required
            ></textarea>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl flex gap-3 text-sm text-slate-400">
            <Info className="h-5 w-5 text-primary-400 flex-shrink-0" />
            <p>Admin approval is required to prevent spam and ensure the platform's integrity. Most requests are reviewed within 24 hours.</p>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            Submit Application
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}

