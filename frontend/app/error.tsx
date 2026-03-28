"use client";

import { buttonVariants } from "@/components/ui/button";

import { HomeIcon } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 overflow-hidden">
      <div className="relative z-10 max-w-4xl space-y-6 text-center">
        <h1 className="mask-b-from-20% mask-b-to-80% font-extrabold text-9xl">
          500
        </h1>
        <p className="-mt-8 text-nowrap text-foreground/80">
          Something bad happened, please refresh the page or go back to home.
        </p>
      </div>
      <div className="mt-8">
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          <HomeIcon data-icon="inline-start" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
