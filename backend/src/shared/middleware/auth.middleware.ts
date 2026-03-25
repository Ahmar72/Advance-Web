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
      res.status(401).json({
        success: false,
        error: "Missing or invalid authorization header",
      });
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      const user = await AuthService.getUserByAccessToken(token);
      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
  } catch (error) {
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
