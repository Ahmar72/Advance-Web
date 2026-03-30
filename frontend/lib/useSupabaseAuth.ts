"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase/client";
import type { User, AuthError } from "@supabase/supabase-js";
import type { UserMetadata, UserRole } from "./AuthContext";

type AppRole = UserRole;

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const MODERATOR_EMAIL = process.env.NEXT_PUBLIC_MODERATOR_EMAIL;

async function applyRoleForSampleEmail(
  user: User | null,
): Promise<User | null> {
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

  const existingMeta = (user.user_metadata || {}) as UserMetadata;

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

function getRoleFromUser(user: User | null): AppRole | null {
  if (!user) return null;
  const metadata = (user.user_metadata || {}) as UserMetadata;
  return metadata.role ?? null;
}

type AuthState = {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  error: AuthError | null;
};

const authStore: AuthState = {
  user: null,
  role: null,
  loading: true,
  error: null,
};

const listeners = new Set<() => void>();
let initialized = false;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setAuthStoreState(next: Partial<AuthState>) {
  if (typeof next.user !== "undefined") authStore.user = next.user;
  if (typeof next.role !== "undefined") authStore.role = next.role;
  if (typeof next.loading !== "undefined") authStore.loading = next.loading;
  if (typeof next.error !== "undefined") authStore.error = next.error;
  emitChange();
}

async function initializeAuthStore() {
  if (initialized) return;
  initialized = true;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userWithRole = await applyRoleForSampleEmail(user);
    setAuthStoreState({
      user: userWithRole,
      role: getRoleFromUser(userWithRole),
      loading: false,
      error: null,
    });
  } catch (err) {
    setAuthStoreState({
      error: err as AuthError,
      loading: false,
    });
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    const authedUser = session?.user ?? null;
    const userWithRole = await applyRoleForSampleEmail(authedUser);
    setAuthStoreState({
      user: userWithRole,
      role: getRoleFromUser(userWithRole),
      error: null,
    });
  });
}

export function useSupabaseAuth() {
  const [state, setState] = useState<AuthState>(authStore);

  useEffect(() => {
    void initializeAuthStore();

    const listener = () => {
      setState({ ...authStore });
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setAuthStoreState({ error });
      return { data: null };
    }

    if (data.user) {
      const userWithRole = await applyRoleForSampleEmail(data.user);
      setAuthStoreState({
        user: userWithRole,
        role: getRoleFromUser(userWithRole),
        error: null,
      });
    }

    return { data };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthStoreState({ error });
      return { data: null };
    }

    if (data.user) {
      const userWithRole = await applyRoleForSampleEmail(data.user);
      setAuthStoreState({
        user: userWithRole,
        role: getRoleFromUser(userWithRole),
        error: null,
      });
    }

    return { data };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthStoreState({ error });
      return;
    }

    setAuthStoreState({
      user: null,
      role: null,
      error: null,
    });
  }, []);

  return {
    user: state.user,
    role: state.role,
    loading: state.loading,
    error: state.error,
    signUp,
    signIn,
    signOut,
  };
}
