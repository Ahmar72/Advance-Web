"use client";

import { useState } from "react";
import { useTransition } from "react";

interface GitHubSignInButtonProps {
  disabled?: boolean;
  onSign?: () => void;
}

export function GitHubSignInButton({
  disabled = false,
  onSign,
}: GitHubSignInButtonProps) {
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending;

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          onSign?.();
        });
      }}
      disabled={isLoading || disabled}
      className="w-full group relative inline-flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: isLoading || disabled 
          ? "#f3f4f6" 
          : "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
        border: "1px solid #e5e7eb",
        color: isLoading || disabled ? "#6b7280" : "#ffffff",
      }}
    >
      {/* GitHub Icon */}
      <svg
        className="h-5 w-5 transition-transform group-hover:scale-110"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.914 1.209.092-.937.35-1.546.636-1.903-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.819c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.375.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.194 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
          clipRule="evenodd"
        />
      </svg>

      {/* Loading Spinner */}
      {isLoading && (
        <svg
          className="absolute h-5 w-5 animate-spin"
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
      )}

      <span className={isLoading ? "opacity-0" : ""}>
        {isLoading ? "Signing in..." : "Sign in with GitHub"}
      </span>
    </button>
  );
}
