import { Router } from "express";
import { userMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { rateLimiter } from "../middleware/rateLimiter.middleware.js";
import { chatSchema } from "../validators/chat.validator.js";
import { chat } from "../controllers/chat.controller.js";

const router = Router();

// Protected + rate-limited (10 requests per minute per user)
// Gemini free tier has real RPM caps — this prevents hitting them
router.post(
  "/",
  userMiddleware,
  rateLimiter(60_000, 10),
  validate(chatSchema),
  chat
);

export default router;
