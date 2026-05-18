import { Hero } from '@/components/landing/hero';
import { db } from '@/db';
import { elections } from '@/db/schema';
import { eq, desc, or, and, gte, lte } from 'drizzle-orm';
import { ShieldCheck, Timer, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Countdown } from '@/components/ui/countdown';

async function getElections() {
  try {
    const allElections = await db.query.elections.findMany({
      where: eq(elections.status, 'published'),
      orderBy: [desc(elections.createdAt)],
      limit: 6,
      with: {
        polls: {
          with: {
            candidates: true
          }
        },
        creator: true
      }
    });
    return allElections;
  } catch (e) {
    return [];
  }
}

export default async function LandingPage() {
  const electionList = await getElections();

  return (
    <main className="flex-1">
      <Hero />
      
      <section id="elections" className="py-24 bg-slate-950/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-display font-bold">Featured Elections</h2>
              <p className="text-slate-400 max-w-xl">
                Browse through active, upcoming, and archived elections across various organizations.
              </p>
            </div>
          </div>

          {electionList.length === 0 ? (
            <div className="text-center py-20 glass-dark rounded-3xl border border-dashed border-slate-800">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No active elections found</h3>
              <p className="text-slate-500 mb-6">Be the first to create an election for your organization.</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 rounded-xl font-semibold hover:bg-primary-500 transition-all"
              >
                Create Election
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {electionList.map((election) => (
                <Link key={election.id} href={`/elections/${election.id}`} className="group">
                  <div className="p-6 glass-dark rounded-3xl border border-slate-800 hover:border-primary-500/50 transition-all flex flex-col h-full space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-[10px] font-bold uppercase tracking-widest">
                        {election.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <Countdown targetDate={election.endDate} />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-display font-bold group-hover:text-primary-400 transition-colors line-clamp-1">{election.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2 flex-1">{election.description}</p>
                    
                    <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {election.creator?.fullName?.[0]}
                        </div>
                        <span className="text-xs text-slate-400">{election.creator?.organization || election.creator?.fullName}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* Stats Section */}
      <section className="py-24 border-y border-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Total Votes', value: '124.5k+', icon: ShieldCheck },
              { label: 'Active Polls', value: '842', icon: Timer },
              { label: 'Registered Voters', value: '42.1k', icon: Users },
              { label: 'Organizations', value: '120+', icon: ShieldCheck },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-400 mx-auto mb-4">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-display font-bold">{stat.value}</div>
                <div className="text-slate-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">S</div>
              <span className="font-display font-bold text-xl tracking-tight">SecureVote</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Audit Trail</a>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 SecureVote. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
