"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";
export type AccentColor = "default" | "neon-green" | "neon-pink" | "neon-blue";

interface ThemeContextValue {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_MODE_KEY = "aw-theme-mode";
const THEME_ACCENT_KEY = "aw-theme-accent";

function applyTheme(mode: ThemeMode, accent: AccentColor) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  const accentClasses = [
    "accent-default",
    "accent-neon-green",
    "accent-neon-pink",
    "accent-neon-blue",
  ];

  root.classList.remove(...accentClasses);

  const accentClass = `accent-${accent}`;
  root.classList.add(accentClass);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [accent, setAccentState] = useState<AccentColor>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedMode = (window.localStorage.getItem(THEME_MODE_KEY) as
      | ThemeMode
      | null) ?? null;
    const storedAccent = (window.localStorage.getItem(THEME_ACCENT_KEY) as
      | AccentColor
      | null) ?? null;

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    ).matches;

    const initialMode: ThemeMode = storedMode ?? (prefersDark ? "dark" : "light");
    const initialAccent: AccentColor = storedAccent ?? "default";

    setModeState(initialMode);
    setAccentState(initialAccent);
    applyTheme(initialMode, initialAccent);
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_MODE_KEY, next);
    }
    applyTheme(next, accent);
  };

  const setAccent = (next: AccentColor) => {
    setAccentState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_ACCENT_KEY, next);
    }
    applyTheme(mode, next);
  };

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
