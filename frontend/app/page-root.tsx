'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect based on role
        if (user.role === 'admin' || user.role === 'super_admin') {
          router.push('/admin/dashboard');
        } else if (user.role === 'moderator') {
          router.push('/moderator/queue');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Public users see landing page
        router.push('/home');
      }
    }
  }, [user, isLoading, router]);

  return null;
}
