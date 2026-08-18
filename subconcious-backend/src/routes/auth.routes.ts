import { Router } from "express";
import passport from "../config/passport.js";
import { validate } from "../middleware/validate.middleware.js";
import { userMiddleware } from "../middleware/auth.middleware.js";
import { signupSchema, signinSchema } from "../validators/auth.validator.js";
import {
  signup,
  signin,
  googleCallback,
  githubCallback,
  me,
} from "../controllers/auth.controller.js";

const router = Router();

// Local auth
router.post("/signup", validate(signupSchema), signup);
router.post("/signin", validate(signinSchema), signin);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleCallback
);

// GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/login" }),
  githubCallback
);

// Current user
router.get("/me", userMiddleware, me);

export default router;
