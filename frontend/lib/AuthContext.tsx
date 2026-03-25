"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = localStorage.getItem("accessToken");
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        // Clear corrupted session data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const signInWithGitHub = async () => {
    try {
      setIsLoading(true);

      // Get GitHub sign-in URL from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/github/signin`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Redirect to GitHub OAuth
      window.location.href = data.data.url;
    } catch (error) {
      console.error("GitHub sign-in failed:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);

      if (accessToken) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }

      // Clear state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        accessToken,
        refreshToken,
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
