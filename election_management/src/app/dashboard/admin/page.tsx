import { requireRole } from '@/lib/auth';
import { db } from '@/db';
import { electionRequests, profiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Check, X, Mail, Phone, Building, User } from 'lucide-react';
import { revalidatePath } from 'next/cache';

async function handleRequest(requestId: string, action: 'approve' | 'reject', formData?: FormData) {
  'use server';
  await requireRole(['super_admin']);

  const request = await db.query.electionRequests.findFirst({
    where: eq(electionRequests.id, requestId),
  });

  if (!request) return;

  if (action === 'approve') {
    // 1. Update request status
    await db.update(electionRequests)
      .set({ status: 'approved' })
      .where(eq(electionRequests.id, requestId));

    // 2. Update user role
    await db.update(profiles)
      .set({ role: 'election_creator' })
      .where(eq(profiles.id, request.creatorId));
  } else {
    const reason = formData?.get('reason') as string || null;
    await db.update(electionRequests)
      .set({ status: 'rejected', rejectionReason: reason })
      .where(eq(electionRequests.id, requestId));
  }

  revalidatePath('/dashboard/admin');
}

export default async function AdminDashboardPage() {
  await requireRole(['super_admin']);

  const pendingRequests = await db.query.electionRequests.findMany({
    where: eq(electionRequests.status, 'pending'),
    orderBy: [desc(electionRequests.createdAt)],
    with: {
      creator: true
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
        <p className="text-slate-400">Review and manage election creator requests.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pendingRequests.length === 0 ? (
          <div className="p-12 glass-dark rounded-3xl border border-dashed border-slate-800 text-center text-slate-500">
            No pending requests at the moment.
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div key={request.id} className="p-6 glass-dark rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{request.creator?.fullName}</h3>
                    <p className="text-sm text-slate-500">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="h-4 w-4" />
                    {request.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="h-4 w-4" />
                    {request.phone}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 md:col-span-2">
                    <Building className="h-4 w-4" />
                    {request.organization}
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                  <p className="text-sm font-medium text-slate-300 mb-1">Purpose:</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{request.purpose}</p>
                </div>
              </div>

              <div className="flex md:flex-col gap-3">
                <form action={handleRequest.bind(null, request.id, 'approve')}>
                  <button className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                    <Check className="h-5 w-5" />
                    Approve
                  </button>
                </form>
                <form action={handleRequest.bind(null, request.id, 'reject')}>
                  <button className="w-full px-6 py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                    <X className="h-5 w-5" />
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
