"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface AdminShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const navItems = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/payment-queue", label: "Payment Queue" },
  { href: "/moderator/queue", label: "Moderation Queue" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/packages", label: "Packages" },
  { href: "/system-health", label: "System Health" },
  { href: "/dashboard", label: "User Listings" },
  { href: "/settings", label: "Settings" },
];

export function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-5 border-b border-zinc-200">
          <h1 className="text-lg font-semibold text-zinc-900">Admin Panel</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage platform & listings</p>
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
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-zinc-200 text-xs text-zinc-500">
          Admin access • Roles: admin, super_admin
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
            )}
          </div>
        </header>
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
