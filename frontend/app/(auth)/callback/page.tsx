"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");

        if (!code) {
          setError("No authorization code received from GitHub");
          return;
        }

        startTransition(async () => {
          // Exchange code for session
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/github/callback`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ code }),
            }
          );

          const data = await response.json();

          if (!data.success) {
            setError(data.error || "Authentication failed");
            return;
          }

          // Store tokens and user info
          const { access_token, refresh_token, user } = data.data;

          localStorage.setItem("accessToken", access_token);
          localStorage.setItem("refreshToken", refresh_token);
          localStorage.setItem("user", JSON.stringify(user));

          // Redirect to home
          router.replace("/");
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    handleCallback();
  }, [searchParams, router]);

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
