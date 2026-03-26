"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase OAuth callback usually provides `code` (PKCE flow).
        // If code exists, exchange it for a session; otherwise fallback to getSession().
        const code = searchParams.get("code");
        const { data, error: sessionError } = code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.getSession();

        const session = data.session;

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (!session || !session.user) {
          throw new Error("No session returned from Supabase");
        }

        // Store session info
        localStorage.setItem("accessToken", session.access_token);
        localStorage.setItem("refreshToken", session.refresh_token || "");
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          })
        );

        // Notify AuthProvider so it reloads session from localStorage.
        window.dispatchEvent(new Event("auth-session-updated"));

        // Redirect to home
        router.replace("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Completing Sign In
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {error ? "An error occurred" : "Please wait while we complete your authentication..."}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
          <button
            onClick={() => router.push("/signin")}
            className="mt-4 text-sm font-medium text-red-900 dark:text-red-200 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <svg
            className="h-8 w-8 animate-spin text-zinc-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
        </div>
      )}
    </div>
  );
}
