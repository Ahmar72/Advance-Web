"use client";

import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  full_name?: string;
  is_verified_seller?: boolean;
  avatar_url?: string | null;
  role?: 'client' | 'moderator' | 'admin' | 'super_admin';
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

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem("accessToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");
      const storedUser = localStorage.getItem("user");

      if (storedToken) {
        try {
          const meResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            }
          );

          if (meResponse.ok) {
            const json = await meResponse.json();
            const meUser = json.data as User;

            setAccessToken(storedToken);
            setRefreshToken(storedRefreshToken);
            setUser(meUser);

            // Keep localStorage in sync with latest user profile (including role).
            localStorage.setItem("user", JSON.stringify(meUser));
            return;
          }
        } catch (error) {
          console.error("Failed to fetch current user from backend:", error);
        }

        // Fallback: use whatever was stored locally if present.
        if (storedUser) {
          setAccessToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));
          return;
        }
      }

      // If anything is missing or backend call failed without fallback, treat as signed out.
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    } catch (error) {
      console.error("Failed to load session:", error);
      // Clear corrupted session data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load session from localStorage on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Re-load session when the OAuth callback updates localStorage.
  useEffect(() => {
    const onSessionUpdated = () => {
      loadSession();
    };
    window.addEventListener("auth-session-updated", onSessionUpdated);

    // Also listen for storage events from other tabs/windows.
    const onStorage = () => {
      loadSession();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("auth-session-updated", onSessionUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadSession]);

  const signInWithGitHub = async () => {
    try {
      setIsLoading(true);
      console.log("Starting GitHub sign-in...");
      console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);

      // Get GitHub sign-in URL from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/github/signin`);
      console.log("Backend response status:", response.status);
      
      const data = await response.json();
      console.log("Backend response data:", data);

      if (!data.success) {
        throw new Error(data.error || "Failed to get GitHub URL");
      }

      if (!data.data?.url) {
        throw new Error("No GitHub URL in response");
      }

      console.log("Redirecting to GitHub:", data.data.url);
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
