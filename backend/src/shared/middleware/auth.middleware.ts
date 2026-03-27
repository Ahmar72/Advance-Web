import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../features/auth/auth.service";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error('[AUTH] Missing or invalid auth header:', authHeader);
      res.status(401).json({
        success: false,
        error: "Missing or invalid authorization header",
      });
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    console.log('[AUTH] Validating token:', token.substring(0, 20) + '...');

    try {
      const user = await AuthService.getUserByAccessToken(token);
      console.log('[AUTH] Token valid, user:', user.id);
      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      console.error('[AUTH] Token validation failed:', error instanceof Error ? error.message : error);
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error('[AUTH] Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: "Authentication check failed",
    });
  }
};

/**
 * Optional auth middleware - attaches user if token is valid, but doesn't block
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);

      try {
        const user = await AuthService.getUserByAccessToken(token);
        req.user = user;
        req.token = token;
      } catch (error) {
        // Silently ignore auth errors for optional auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-based access control middleware
 * Requires requireAuth to be called first
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(401).json({
          success: false,
          error: "User role not found",
        });
        return;
      }

      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          error: `Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${userRole}`,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Role verification failed",
      });
    }
  };
};

