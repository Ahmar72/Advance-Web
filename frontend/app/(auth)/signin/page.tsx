"use client";

import { useState, useTransition, FormEvent, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { GitHubSignInButton } from "@/components/GitHubSignInButton";
import type { UserRole } from "@/lib/AuthContext";

type ViewMode = "signin" | "signup";

export default function SignInPage() {
  const router = useRouter();
  const { signInWithGitHub } = useAuth();
  const { signIn, signUp, loading: authLoading, role } = useSupabaseAuth();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<ViewMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGitHubSignIn = () => {
    startTransition(async () => {
      try {
        await signInWithGitHub();
      } catch (error) {
        console.error("Sign in failed:", error);
      }
    });
  };

  const redirectAfterAuth = (
    emailValue: string,
    effectiveRole?: UserRole | null,
  ) => {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const moderatorEmail = process.env.NEXT_PUBLIC_MODERATOR_EMAIL;

    const normalized = emailValue.toLowerCase();

    if (adminEmail && normalized === adminEmail.toLowerCase()) {
      router.push("/admin/dashboard");
      return;
    }

    if (moderatorEmail && normalized === moderatorEmail.toLowerCase()) {
      router.push("/moderator/queue");
      return;
    }

    const finalRole = effectiveRole ?? role;

    if (finalRole === "admin" || finalRole === "super_admin") {
      router.push("/admin/dashboard");
    } else if (finalRole === "moderator") {
      router.push("/moderator/queue");
    } else {
      router.push("/dashboard");
    }
  };

  const handleEmailPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (!email || !password) {
        setFormError("Please enter email and password.");
        return;
      }

      if (mode === "signup" && password.length < 6) {
        setFormError("Password must be at least 6 characters.");
        return;
      }

      if (mode === "signin") {
        const { data } = await signIn(email, password);
        if (!data) {
          setFormError("Invalid email or password.");
          return;
        }
        const signedInRole =
          ((data.user?.user_metadata as { role?: UserRole } | undefined)
            ?.role as UserRole | undefined) ?? null;
        redirectAfterAuth(email, signedInRole);
      } else {
        const { data } = await signUp(email, password);
        if (!data) {
          setFormError("Failed to create account.");
          return;
        }
        const signedUpRole =
          ((data.user?.user_metadata as { role?: UserRole } | undefined)
            ?.role as UserRole | undefined) ?? null;
        redirectAfterAuth(email, signedUpRole);
      }
    } catch (err) {
      console.error("Auth error", err);
      setFormError("Authentication failed. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const isBusy = isPending || authLoading || formLoading;

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-zinc-200/70" />
        <div className="h-56 rounded-lg border border-zinc-200 bg-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with email/password or GitHub to get started to{" "}
          <span className="font-bold text-primary">Adflow</span>
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex text-xs font-medium text-zinc-600 dark:text-zinc-300 rounded-md bg-zinc-100 dark:bg-zinc-800 p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 py-1.5 rounded-md transition ${
              mode === "signin"
                ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-50"
                : "opacity-75"
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-1.5 rounded-md transition ${
              mode === "signup"
                ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-50"
                : "opacity-75"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleEmailPasswordSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {formError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <button
            type="submit"
            // disabled={isBusy}
            className="w-full mt-2 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {isBusy
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
                ? "Sign in with Email"
                : "Create Account"}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          <span>or continue with GitHub</span>
          <span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <GitHubSignInButton disabled={isBusy} onSign={handleGitHubSignIn} />
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
          Benefits of signing in:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Role-based dashboards for client, moderator, and admin
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Manage ads end-to-end from your dashboard
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            No email verification required for demo accounts
          </li>
        </ul>
      </div>

      <p className="text-xs text-center text-zinc-600 dark:text-zinc-400 leading-relaxed">
        By signing in, you agree to our{" "}
        <a
          href="/terms"
          className="underline hover:text-zinc-900 dark:hover:text-zinc-300"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="underline hover:text-zinc-900 dark:hover:text-zinc-300"
        >
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
