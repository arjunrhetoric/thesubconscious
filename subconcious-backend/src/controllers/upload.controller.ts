import type { Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { env } from "../config/env.js";

/**
 * GET /api/v1/upload/sign
 * Generate a Cloudinary signature for direct client-side upload.
 * Used when publishing/sharing pages publicly.
 */
export const getSignature = asyncHandler(
  async (_req: Request, res: Response) => {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      res.status(503).json({
        success: false,
        message: "Cloud image uploads are not configured. Images are stored locally on your device.",
      });
      return;
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "thesubconscious";

    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET
    );

    res.json({
      success: true,
      signature,
      timestamp,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      folder,
    });
  }
);
