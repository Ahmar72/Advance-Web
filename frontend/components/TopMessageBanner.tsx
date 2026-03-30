"use client";

import { useState } from "react";

type BannerTone = "success" | "error" | "warning" | "info";

type TopMessageBannerProps = {
  message: string;
  tone?: BannerTone;
};

const toneClasses: Record<BannerTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export function TopMessageBanner({
  message,
  tone = "info",
}: TopMessageBannerProps) {
  const [open, setOpen] = useState(true);

  if (!message || !open) return null;

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-current/30 hover:bg-black/5"
          aria-label="Close message"
          title="Close"
        >
          x
        </button>
      </div>
    </div>
  );
}
