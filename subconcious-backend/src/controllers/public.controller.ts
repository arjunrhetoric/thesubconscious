import type { Request, Response } from "express";
import { Page } from "../models/page.model.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { AppError } from "../middleware/error.middleware.js";

/**
 * GET /api/v1/public/pages/:shareSlug
 * Returns a shared page in read-only mode. No auth required.
 * If includeSubpagesInShare is true, returns the child tree as well.
 * Never exposes userId or other user fields.
 */
export const getSharedPage = asyncHandler(
  async (req: Request, res: Response) => {
    const { shareSlug } = req.params;

    const page = await Page.findOne({
      shareSlug,
      isPublic: true,
    }).lean();

    if (!page) {
      throw new AppError("Shared page not found or is no longer public.", 404);
    }

    // Strip user-sensitive fields
    const safePage = {
      _id: page._id,
      title: page.title,
      content: page.content,
      tags: page.tags.filter((t) => t.status === "accepted"), // Only show accepted tags
      isPublic: page.isPublic,
      shareSlug: page.shareSlug,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };

    let children: any[] = [];

    if (page.includeSubpagesInShare) {
      // Build child tree recursively
      async function buildSubTree(parentId: string): Promise<any[]> {
        const childPages = await Page.find({
          parentId,
          userId: page!.userId, // Same user's pages
        })
          .select("title content tags shareSlug order createdAt updatedAt")
          .sort({ order: 1 })
          .lean();

        const nodes = [];
        for (const child of childPages) {
          const grandChildren = await buildSubTree(child._id.toString());
          nodes.push({
            _id: child._id,
            title: child.title,
            content: child.content,
            tags: child.tags.filter((t) => t.status === "accepted"),
            order: child.order,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt,
            children: grandChildren,
          });
        }
        return nodes;
      }

      children = await buildSubTree(page._id.toString());
    }

    res.json({
      success: true,
      page: safePage,
      children,
    });
  }
);
