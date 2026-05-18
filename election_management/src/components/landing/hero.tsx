'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Secure. Anonymous. Transparent.</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-bold tracking-tight"
          >
            The Next Generation of <br />
            <span className="text-gradient">Digital Democracy</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto"
          >
            SecureVote provides a robust platform for organizations to conduct high-stakes elections with total transparency and absolute voter anonymity.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-semibold shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#elections"
              className="w-full sm:w-auto px-8 py-4 glass-dark hover:bg-slate-800/60 rounded-2xl font-semibold transition-all"
            >
              View Active Elections
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: ShieldCheck,
              title: "Encrypted Privacy",
              description: "Military-grade encryption ensures voter anonymity and vote integrity."
            },
            {
              icon: Zap,
              title: "Instant Results",
              description: "Real-time vote counting and turnout statistics as they happen."
            },
            {
              icon: BarChart3,
              title: "Live Analytics",
              description: "Comprehensive charts and data visualization for deep insights."
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 glass-dark rounded-3xl border border-slate-800/50 hover:border-primary-500/30 transition-colors space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-display font-semibold">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
