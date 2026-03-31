"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface ModeratorShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const navItems: { href: Route; label: string }[] = [
  { href: "/moderator/queue", label: "Review Queue" },
  { href: "/dashboard", label: "Client View" },
  { href: "/settings", label: "Settings" },
];

export function ModeratorShell({ title, subtitle, children }: ModeratorShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <div className="px-4 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Moderator Panel
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Review and flag ads
          </p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
          Moderator access • Roles: moderator, admin, super_admin
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <ThemeSwitcher />
          </div>
        </header>
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
