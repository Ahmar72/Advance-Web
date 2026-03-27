"use client";

import { useState, useTransition, FormEvent } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";
import { useRouter } from "next/navigation";
import { GitHubSignInButton } from "@/components/GitHubSignInButton";

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

  const handleGitHubSignIn = () => {
    startTransition(async () => {
      try {
        await signInWithGitHub();
      } catch (error) {
        console.error("Sign in failed:", error);
      }
    });
  };

  const redirectAfterAuth = (emailValue: string) => {
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

    if (role === "admin" || role === "super_admin") {
      router.push("/admin/dashboard");
    } else if (role === "moderator") {
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
      } else {
        const { data } = await signUp(email, password);
        if (!data) {
          setFormError("Failed to create account.");
          return;
        }
      }

      redirectAfterAuth(email);
    } catch (err) {
      console.error("Auth error", err);
      setFormError("Authentication failed. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const isBusy = isPending || authLoading || formLoading;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.914 1.209.092-.937.35-1.546.636-1.903-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.819c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.375.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome
          </h1>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with email/password or GitHub to get started
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
            <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>
          )}

          <button
            type="submit"
            disabled={isBusy}
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

      <div className="space-y-3">
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
        <a href="/terms" className="underline hover:text-zinc-900 dark:hover:text-zinc-300">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-zinc-900 dark:hover:text-zinc-300">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
