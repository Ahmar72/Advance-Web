"use client";

import { useTheme } from "@/lib/ThemeProvider";

const accentOptions = [
  { id: "default", label: "Classic" },
  { id: "neon-green", label: "Neon Green" },
  { id: "neon-pink", label: "Neon Pink" },
  { id: "neon-blue", label: "Neon Blue" },
] as const;

export function ThemeSwitcher() {
  const { mode, accent, setMode, setAccent } = useTheme();

  return (
    <div className="inline-flex items-center gap-3 rounded-full bg-white/70 backdrop-blur px-3 py-1.5 border border-zinc-200 shadow-sm text-xs md:text-sm text-zinc-700">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMode("light")}
          className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
            mode === "light"
              ? "bg-zinc-900 text-white"
              : "hover:bg-zinc-100"
          }`}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => setMode("dark")}
          className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
            mode === "dark"
              ? "bg-zinc-900 text-white"
              : "hover:bg-zinc-100"
          }`}
        >
          Dark
        </button>
      </div>

      {mode === "dark" && (
        <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-zinc-200">
          {accentOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAccent(opt.id)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border ${
                accent === opt.id
                  ? "border-transparent text-white bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-500 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                  : "border-zinc-200 text-zinc-600 bg-white/80 hover:bg-zinc-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
