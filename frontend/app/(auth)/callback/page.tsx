"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/AuthContext";

/**
 * OAuth callback page for GitHub sign-in using Supabase directly.
 *
 * Supabase handles the code exchange internally and stores the session
 * client-side. We only need to confirm there is a session and then
 * redirect the user back into the app.
 */
export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        const session = data.session;

        if (!session || !session.user) {
          throw new Error("No session returned from Supabase");
        }

        const role =
          ((session.user.user_metadata as { role?: UserRole } | undefined)
            ?.role as UserRole | undefined) ?? "client";

        if (role === "admin" || role === "super_admin") {
          router.replace("/admin/dashboard");
          return;
        }

        if (role === "moderator") {
          router.replace("/moderator/queue");
          return;
        }

        router.replace("/dashboard");
      } catch (err: unknown) {
        console.error("[Callback] Unexpected error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to complete sign-in.",
        );
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-red-100">
          <h1 className="text-2xl font-semibold text-red-600 mb-2">
            Sign-in Error
          </h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => (window.location.href = "/signin")}
            className="w-full py-2.5 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Sign In
        </h1>
        <p className="text-gray-600">
          Please wait while we finalize your login...
        </p>
      </div>
    </div>
  );
}
