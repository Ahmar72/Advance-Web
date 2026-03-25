import { Request, Response, NextFunction } from "express";

export interface ErrorResponse {
  success: false;
  error: string;
  statusCode?: number;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (err: Error | any, req: Request, res: Response, next: NextFunction): void => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
