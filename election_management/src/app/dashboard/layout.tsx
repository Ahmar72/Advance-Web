import { requireAuth, getProfile } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  UserCircle, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  PlusCircle, 
  History,
  Menu
} from 'lucide-react';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/sign-out-button';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const profile = await getProfile(user.id);

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Profile', href: '/dashboard/profile', icon: UserCircle },
  ];

  if (profile?.role === 'super_admin') {
    menuItems.push(
      { label: 'Admin Panel', href: '/dashboard/admin', icon: ShieldCheck },
      { label: 'Audit Logs', href: '/dashboard/audit', icon: History }
    );
  }

  if (profile?.role === 'election_creator') {
    menuItems.push(
      { label: 'My Elections', href: '/dashboard/creator', icon: PlusCircle }
    );
  }

  if (profile?.role === 'voter') {
    menuItems.push(
      { label: 'Become a Creator', href: '/dashboard/creator/request', icon: PlusCircle }
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">S</div>
            <span className="font-display font-bold text-xl tracking-tight">SecureVote</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all group"
            >
              <item.icon className="h-5 w-5 group-hover:text-primary-400 transition-colors" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <UserCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{profile?.fullName}</p>
              <p className="text-xs text-slate-500 truncate uppercase">{profile?.role}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 border-b border-slate-900 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="md:hidden">
             <Menu className="h-6 w-6 text-slate-400" />
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
