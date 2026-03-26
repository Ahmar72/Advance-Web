import { createAdminSupabase } from "../../config/supabase";
import { SessionData, AuthUser } from "./auth.types";

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

      return {
        id: data.user.id,
        email: data.user.email || "",
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
