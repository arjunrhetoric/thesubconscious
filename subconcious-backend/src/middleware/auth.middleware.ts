import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util.js";

/**
 * Auth middleware: extracts Bearer token from Authorization header,
 * verifies JWT, and attaches req.userId. Returns 401 on missing/invalid.
 */
export function userMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Provide a Bearer token.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Token is missing.",
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}
