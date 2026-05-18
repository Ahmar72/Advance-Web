import { AuthForm } from '@/components/auth/auth-form';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary-500" />}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
