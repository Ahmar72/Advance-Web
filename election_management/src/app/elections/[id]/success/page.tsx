import { CheckCircle2, ArrowRight, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function VoteSuccessPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 p-12 glass-dark rounded-[3rem] border border-emerald-500/20 bg-emerald-500/5 shadow-2xl shadow-emerald-500/10">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse"></div>
          <CheckCircle2 className="h-24 w-24 text-emerald-400 mx-auto relative z-10" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-display font-bold text-white">Vote Cast Successfully</h1>
          <p className="text-slate-400 leading-relaxed">
            Your anonymous vote has been securely recorded and verified. Thank you for participating in this democratic process.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link
            href={`/elections/${params.id}/results`}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/20"
          >
            View Live Results
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full py-4 glass-dark hover:bg-slate-800 text-white font-bold rounded-2xl transition-all block"
          >
            Return to Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Share2 className="h-4 w-4" />
          <span>Help us spread the word about SecureVote</span>
        </div>
      </div>
    </main>
  );
}
