"use client";

import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { AdminShell } from "@/components/admin/AdminShell";

export default function SettingsPage() {
  const { user, loading, signOut } = useSupabaseAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-base text-zinc-500">Loading your settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-zinc-50 to-zinc-100">
        <div className="bg-white border border-zinc-200 rounded-2xl px-8 py-10 shadow-sm text-center max-w-md mx-auto">
          <h1 className="text-2xl font-semibold text-zinc-900">
            You&apos;re not signed in
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Please sign in to view and manage your account settings.
          </p>
          <button
            onClick={() => router.push("/signin")}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const role = (user.user_metadata?.role as string) || "client";
  const email = (user.email || "").toLowerCase();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

  const isAdmin = !!adminEmail && email === adminEmail;

  const innerContent = (
    <div className="space-y-6">
      <section className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Basic information about your account.
        </p>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium text-zinc-900">{user.email}</dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Role</dt>
            <dd className="capitalize text-zinc-900">{role}</dd>
          </div>
        </dl>
      </section>

      <section className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Security</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Sign out of your account on this device.
        </p>

        <button
          onClick={handleLogout}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
        >
          Sign Out
        </button>
      </section>
    </div>
  );

  // For admins, render inside the AdminShell to match the
  // rest of the admin panel UI. For regular users, keep a
  // simple centered layout with the same visual language.
  if (isAdmin) {
    return (
      <AdminShell
        title="Account Settings"
        subtitle="Manage your profile and dashboard access"
      >
        {innerContent}
      </AdminShell>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">Account Settings</h1>
          <p className="text-sm text-zinc-500">
            Manage your account, security, and access to different dashboards.
          </p>
        </div>
        {innerContent}
      </div>
    </div>
  );
}
