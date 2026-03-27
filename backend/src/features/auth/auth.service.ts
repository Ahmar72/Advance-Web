import { createAdminSupabase } from "../../config/supabase";
import { SessionData, AuthUser } from "./auth.types";
import type { UserRole } from "../../shared/types/database.types";

export class AuthService {
  /**
   * Get GitHub OAuth URL for sign in (using PKCE flow)
   * Frontend uses this to get the OAuth redirect URL
   */
  static async getGitHubSignInUrl(redirectUrl: string): Promise<string> {
    const supabase = createAdminSupabase();
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          scopes: "user:email",
        },
      });

      if (error) {
        throw new Error(`Failed to get GitHub sign-in URL: ${error.message}`);
      }

      if (!data.url) {
        throw new Error("No OAuth URL returned from Supabase");
      }

      return data.url;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exchange GitHub code for session
   */
  static async signInWithGitHubCode(code: string): Promise<SessionData> {
    const supabase = createAdminSupabase();
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.session) {
        throw new Error(`GitHub authentication failed: ${error?.message || "No session returned"}`);
      }

      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token || "",
        expires_in: data.session.expires_in || 3600,
        expires_at: data.session.expires_at || Date.now() / 1000 + 3600,
        token_type: "Bearer",
        user: {
          id: data.user.id,
          email: data.user.email || "",
          user_metadata: data.user.user_metadata,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exchange refresh token for new access token
   */
  static async refreshSession(refreshToken: string): Promise<SessionData> {
    const supabase = createAdminSupabase();
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session || !data.user) {
        throw new Error(`Session refresh failed: ${error?.message || "No session or user returned"}`);
      }

      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token || "",
        expires_in: data.session.expires_in || 3600,
        expires_at: data.session.expires_at || Date.now() / 1000 + 3600,
        token_type: "Bearer",
        user: {
          id: data.user.id,
          email: data.user.email || "",
          user_metadata: data.user.user_metadata,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by access token
   */
  static async getUserByAccessToken(accessToken: string): Promise<AuthUser> {
    const supabase = createAdminSupabase();
    try {
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error || !data.user) {
        throw new Error(`Failed to fetch user: ${error?.message || "User not found"}`);
      }

      // Ensure a corresponding row exists in the local users table
      const fullName =
        (data.user.user_metadata as any)?.full_name ||
        (data.user.user_metadata as any)?.name ||
        null;

      await supabase
        .from('users')
        .upsert(
          {
            id: data.user.id,
            email: data.user.email || '',
            full_name: fullName,
          },
          { onConflict: 'id' }
        );

      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        // Some projects may have an older users table without `status`.
        // Avoid selecting non-existent columns to prevent runtime errors.
        .select('id, email, full_name, role, created_at, updated_at')
        .eq('id', data.user.id)
        .single();

      if (dbUserError || !dbUser) {
        throw new Error(`Failed to load local user profile: ${dbUserError?.message || 'User not found'}`);
      }

      // Prefer the role from Supabase user_metadata (which is where
      // the frontend writes admin/moderator roles), but fall back to
      // the local users table role and finally "client".
      const dbRole = (dbUser as any).role as string | null | undefined;
      const metadataRole = (data.user.user_metadata as any)?.role as string | undefined;

      const normalizeRole = (role: string | null | undefined): UserRole | null => {
        if (!role) return null;
        const lower = role.toLowerCase();
        if (lower === 'admin' || lower === 'moderator' || lower === 'client' || lower === 'super_admin') {
          return lower as UserRole;
        }
        return null;
      };

      const resolvedRole: UserRole =
        normalizeRole(metadataRole) ||
        normalizeRole(dbRole) ||
        'client';

      // Keep the local users table in sync with the resolved role so
      // that analytics and other queries can rely on it.
      if (dbRole !== resolvedRole) {
        await supabase
          .from('users')
          .update({ role: resolvedRole })
          .eq('id', data.user.id);
      }

      return {
        id: data.user.id,
        email: data.user.email || '',
        role: resolvedRole,
        // Default to 'active' if status column does not exist in this schema
        status: (dbUser as any).status ?? 'active',
        user_metadata: data.user.user_metadata,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign out user (invalidate refresh token)
   */
  static async signOut(accessToken: string): Promise<void> {
    const supabase = createAdminSupabase();
    try {
      const { error } = await supabase.auth.signOut({
        scope: "global",
      });

      if (error) {
        throw new Error(`Sign out failed: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }
}
