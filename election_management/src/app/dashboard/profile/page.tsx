import { requireAuth, getProfile } from '@/lib/auth';
import { User, Mail, Phone, Building, Shield, Calendar } from 'lucide-react';

export default async function ProfilePage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold">My Profile</h1>
        <p className="text-slate-400">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-8 glass-dark rounded-[2.5rem] border border-slate-800 text-center space-y-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-primary-500/20">
              <User className="h-12 w-12 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.fullName}</h2>
              <p className="text-sm text-slate-500 uppercase font-bold tracking-widest">{profile?.role}</p>
            </div>
          </div>
          
          <div className="p-6 glass-dark rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Member Since</span>
              <span className="font-medium">{new Date(profile?.createdAt || '').toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Details Form */}
        <div className="md:col-span-2 p-8 glass-dark rounded-[2.5rem] border border-slate-800">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-400" />
              Account Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Full Name</label>
                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3 text-slate-300">
                  <User className="h-4 w-4 text-slate-600" />
                  {profile?.fullName}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Email Address</label>
                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3 text-slate-300">
                  <Mail className="h-4 w-4 text-slate-600" />
                  {profile?.email}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Phone Number</label>
                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3 text-slate-300">
                  <Phone className="h-4 w-4 text-slate-600" />
                  {profile?.phone || 'Not provided'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">Organization</label>
                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3 text-slate-300">
                  <Building className="h-4 w-4 text-slate-600" />
                  {profile?.organization || 'Individual'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
