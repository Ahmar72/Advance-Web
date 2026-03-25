import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  /**
   * GET /api/v1/auth/github/signin
   * Returns GitHub OAuth URL for frontend to redirect to
   */
  static async getGitHubSignInUrl(req: Request, res: Response): Promise<void> {
    try {
      const callbackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/callback`;
      const url = await AuthService.getGitHubSignInUrl(callbackUrl);

      res.json({
        success: true,
        message: "GitHub OAuth URL generated",
        data: {
          url,
          provider: "github",
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get GitHub sign-in URL",
      });
    }
  }

  /**
   * POST /api/v1/auth/github/callback
   * Exchange GitHub code for session tokens
   */
  static async handleGitHubCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;

      if (!code) {
        res.status(400).json({
          success: false,
          error: "GitHub code is required",
        });
        return;
      }

      const session = await AuthService.signInWithGitHubCode(code);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "GitHub authentication failed",
      });
    }
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  static async refreshSession(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: "Refresh token is required",
        });
        return;
      }

      const session = await AuthService.refreshSession(refreshToken);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to refresh session",
      });
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current user (requires auth token)
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Unauthorized - no user data found",
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get user",
      });
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Sign out user
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = (req as any).token;

      if (token) {
        await AuthService.signOut(token);
      }

      res.json({
        success: true,
        message: "Successfully signed out",
      });
    } catch (error) {
      // Don't fail logout if there's an error, just return success
      res.json({
        success: true,
        message: "Signed out",
      });
    }
  }
}
