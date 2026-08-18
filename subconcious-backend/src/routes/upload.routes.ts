import { Router } from "express";
import rateLimit from "express-rate-limit";
import { userMiddleware } from "../middleware/auth.middleware.js";
import { getSignature } from "../controllers/upload.controller.js";

const router = Router();

// Rate limit: max 15 upload signature requests per hour per authenticated user
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many upload requests. Please try again later (max 15/hour).",
  },
  keyGenerator: (req) => {
    // Rate limit per authenticated user ID (set by userMiddleware)
    return (req as any).userId || "anonymous";
  },
  validate: {
    keyGeneratorIpFallback: false,
  },
});

// Protected — userMiddleware populates req.userId before rate limiter runs
router.get("/sign", userMiddleware, uploadLimiter, getSignature);

export default router;
