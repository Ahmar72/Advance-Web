"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/lib/useSupabaseAuth";

export default function RootPage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/home");
    }
  }, [user, loading, router]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </main>
  );
}
