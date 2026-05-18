import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });
  return profile;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireRole(roles: ('super_admin' | 'election_creator' | 'voter')[]) {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  
  if (!profile || !roles.includes(profile.role)) {
    redirect('/dashboard');
  }
  
  return { user, profile };
}
