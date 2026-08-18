import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { signToken } from "../utils/jwt.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { AppError } from "../middleware/error.middleware.js";
import { env } from "../config/env.js";
import type { SignupInput, SigninInput } from "../validators/auth.validator.js";

const BCRYPT_ROUNDS = 12;

/**
 * POST /api/v1/auth/signup
 * Create a local user with hashed password, return JWT.
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email: rawEmail, password } = req.body as SignupInput;
  const email = rawEmail.toLowerCase().trim();

  // Check if email already exists (any provider)
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.authProvider !== "local") {
      throw new AppError(
        `This email is registered via ${existing.authProvider.charAt(0).toUpperCase() + existing.authProvider.slice(1)} — sign in with ${existing.authProvider.charAt(0).toUpperCase() + existing.authProvider.slice(1)} instead.`,
        409
      );
    }
    throw new AppError("An account with this email already exists.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await User.create({
    email,
    username: email.split("@")[0], // Default username from email prefix
    password: hashedPassword,
    authProvider: "local",
  });

  const token = signToken(user._id.toString());

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    token,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      authProvider: user.authProvider,
      avatarUrl: user.avatarUrl,
    },
  });
});

/**
 * POST /api/v1/auth/signin
 * Authenticate local user with email + password, return JWT.
 */
export const signin = asyncHandler(async (req: Request, res: Response) => {
  const { email: rawEmail, password } = req.body as SigninInput;
  const email = rawEmail.toLowerCase().trim();

  // First check if email exists under any provider
  const userAnyProvider = await User.findOne({ email });

  if (!userAnyProvider) {
    throw new AppError("Invalid credentials.", 403);
  }

  // If the email exists but under a different provider, give a helpful message
  if (userAnyProvider.authProvider !== "local") {
    const provider =
      userAnyProvider.authProvider.charAt(0).toUpperCase() +
      userAnyProvider.authProvider.slice(1);
    throw new AppError(
      `This email is registered via ${provider} — sign in with ${provider} instead.`,
      403
    );
  }

  // Compare password (never query by plaintext password)
  if (!userAnyProvider.password) {
    throw new AppError("Invalid credentials.", 403);
  }

  const isMatch = await bcrypt.compare(password, userAnyProvider.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials.", 403);
  }

  const token = signToken(userAnyProvider._id.toString());

  res.json({
    success: true,
    message: "Signed in successfully",
    token,
    user: {
      id: userAnyProvider._id,
      email: userAnyProvider.email,
      username: userAnyProvider.username,
      authProvider: userAnyProvider.authProvider,
      avatarUrl: userAnyProvider.avatarUrl,
    },
  });
});

/**
 * Google OAuth callback handler.
 * Issues JWT and redirects to frontend with token in query param.
 */
export const googleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) {
      throw new AppError("Google authentication failed.", 401);
    }

    const token = signToken(user._id.toString());
    res.redirect(`${env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

/**
 * GitHub OAuth callback handler.
 * Issues JWT and redirects to frontend with token in query param.
 */
export const githubCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) {
      throw new AppError("GitHub authentication failed.", 401);
    }

    const token = signToken(user._id.toString());
    res.redirect(`${env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

/**
 * GET /api/v1/auth/me
 * Return the current user from JWT (for frontend session rehydration).
 */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      authProvider: user.authProvider,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  });
});
