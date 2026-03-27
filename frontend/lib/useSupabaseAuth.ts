"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { User, AuthError } from "@supabase/supabase-js";

type AppRole = "client" | "moderator" | "admin" | "super_admin";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const MODERATOR_EMAIL = process.env.NEXT_PUBLIC_MODERATOR_EMAIL;

async function applyRoleForSampleEmail(user: User | null): Promise<User | null> {
  if (!user || !user.email) return user;

  let role: AppRole | null = null;

  if (ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    role = "admin";
  } else if (
    MODERATOR_EMAIL &&
    user.email.toLowerCase() === MODERATOR_EMAIL.toLowerCase()
  ) {
    role = "moderator";
  }

  if (!role) return user;

  const existingMeta = (user.user_metadata || {}) as Record<string, unknown>;

  if (existingMeta.role === role) {
    return user;
  }

  // updateUser requires an active auth session; during email sign-up
  // flows Supabase may return a user object without a session yet,
  // which would trigger "Auth session missing". In that case, just
  // skip updating metadata for now to avoid noisy console errors.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return user;
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      ...existingMeta,
      role,
    },
  });

  if (error) {
    console.error("Failed to apply role metadata", error.message);
    return user;
  }

  return data.user ?? user;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const userWithRole = await applyRoleForSampleEmail(user);
        setUser(userWithRole);

        const metaRole = (userWithRole?.user_metadata as { role?: AppRole } | null)?.role;
        setRole(metaRole ?? null);
      } catch (err) {
        setError(err as AuthError);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authedUser = session?.user ?? null;
      const userWithRole = await applyRoleForSampleEmail(authedUser);
      setUser(userWithRole);

      const metaRole = (userWithRole?.user_metadata as { role?: AppRole } | null)?.role;
      setRole(metaRole ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error);
      return { data: null };
    }

    if (data.user) {
      const userWithRole = await applyRoleForSampleEmail(data.user);
      setUser(userWithRole);
      const metaRole = (userWithRole?.user_metadata as { role?: AppRole } | null)?.role;
      setRole(metaRole ?? null);
    }

    return { data };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error);
      return { data: null };
    }

    if (data.user) {
      const userWithRole = await applyRoleForSampleEmail(data.user);
      setUser(userWithRole);
      const metaRole = (userWithRole?.user_metadata as { role?: AppRole } | null)?.role;
      setRole(metaRole ?? null);
    }

    return { data };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error);
    setUser(null);
    setRole(null);
  }, []);

  return { user, role, loading, error, signUp, signIn, signOut };
}
