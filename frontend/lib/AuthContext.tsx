"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import { supabase } from "./supabaseClient";
import { useSupabaseAuth } from "./useSupabaseAuth";

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  full_name?: string;
  is_verified_seller?: boolean;
  avatar_url?: string | null;
  role?: "client" | "moderator" | "admin" | "super_admin";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: supabaseUser, loading } = useSupabaseAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const mappedUser: User | null = supabaseUser
    ? {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        user_metadata: supabaseUser.user_metadata,
        full_name:
          (supabaseUser.user_metadata?.full_name as string | undefined) ||
          (supabaseUser.user_metadata?.name as string | undefined),
        avatar_url: (supabaseUser.user_metadata?.avatar_url as string | null) || null,
        role: (supabaseUser.user_metadata?.role as User["role"]) || "client",
      }
    : null;

  const signInWithGitHub = async () => {
    setIsRedirecting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw error;
      }
    } finally {
      setIsRedirecting(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: mappedUser,
        isLoading: loading || isRedirecting,
        isAuthenticated: !!mappedUser,
        accessToken: null,
        refreshToken: null,
        signInWithGitHub,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
