import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory per-user rate limiter using a Map.
 * Configurable window (ms) and max requests per window.
 * Returns 429 with a friendly message on limit exceed.
 */
export function rateLimiter(
  windowMs: number = 60_000,
  maxRequests: number = 10
) {
  const store = new Map<string, RateLimitEntry>();

  // Periodically clean expired entries (every 5 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60_000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.userId;
    if (!userId) {
      // If no userId, skip rate limiting (shouldn't happen on protected routes)
      next();
      return;
    }

    const now = Date.now();
    const entry = store.get(userId);

    if (!entry || now > entry.resetTime) {
      // New window
      store.set(userId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        message: `You're sending messages too fast. Please wait ${retryAfterSec} seconds.`,
        retryAfter: retryAfterSec,
      });
      return;
    }

    entry.count++;
    next();
  };
}
