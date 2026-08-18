import type { Request, Response, NextFunction } from "express";

/**
 * Application-level error class for throwing errors with status codes.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

/**
 * Centralized error handler middleware.
 * Must be registered LAST in the middleware chain.
 * Catches all thrown errors and formats a consistent JSON response.
 */
export function errorMiddleware(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = "statusCode" in err ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  // Log server errors for debugging
  if (statusCode >= 500) {
    console.error("🔥 Server Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
