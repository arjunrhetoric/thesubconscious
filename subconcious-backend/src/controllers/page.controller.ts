import type { Request, Response } from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { Page } from "../models/page.model.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { AppError } from "../middleware/error.middleware.js";
import type {
  CreatePageInput,
  UpdatePageInput,
  SharePageInput,
  UpdateTagInput,
} from "../validators/page.validator.js";

// Lazy-loaded services (populated in Phase 4)
let qdrantService: typeof import("../services/qdrant.service.js") | null = null;
let chunkingService: typeof import("../services/chunking.service.js") | null = null;
let embeddingService: typeof import("../services/embedding.service.js") | null = null;
let taggingService: typeof import("../services/tagging.service.js") | null = null;

async function loadServices() {
  if (!qdrantService) {
    try {
      qdrantService = await import("../services/qdrant.service.js");
      chunkingService = await import("../services/chunking.service.js");
      embeddingService = await import("../services/embedding.service.js");
      taggingService = await import("../services/tagging.service.js");
    } catch {
      // Services not yet available (Phase 4 not built yet)
    }
  }
}

/**
 * Build the ancestor path for a page (array of ancestor page IDs from root to page).
 */
async function getAncestorPath(pageId: string): Promise<string[]> {
  const path: string[] = [];
  let currentId: string | null = pageId;

  while (currentId) {
    path.unshift(currentId);
    const pageDoc: any = await Page.findById(currentId).select("parentId").lean();
    currentId = pageDoc?.parentId ? pageDoc.parentId.toString() : null;
  }

  return path;
}

async function triggerIndexingPipeline(
  pageId: string,
  userId: string,
  title: string,
  content: any,
  existingTags: any[]
) {
  loadServices().then(async () => {
    if (!chunkingService || !embeddingService || !qdrantService || !taggingService) return;

    try {
      const plainText = chunkingService.tiptapToPlainText(content);
      if (!plainText.trim()) return;

      const ancestorPath = await getAncestorPath(pageId);

      const [chunks] = await Promise.all([
        chunkingService.chunkText(plainText),
        // Auto-tagging (fire and forget)
        (async () => {
          try {
            const suggestedTags = await taggingService!.suggestTags(plainText);
            const freshPage = await Page.findById(pageId).select("tags");
            if (!freshPage) return;

            const existingTagNames = new Set(freshPage.tags.map((t) => t.name.toLowerCase()));
            const newTags = suggestedTags
              .filter((tag) => !existingTagNames.has(tag.toLowerCase()))
              .map((tag) => ({ name: tag, status: "suggested" as const }));

            if (newTags.length > 0) {
              await Page.findByIdAndUpdate(pageId, {
                $push: { tags: { $each: newTags } },
              });
            }
          } catch (err) {
            console.error("Auto-tagging error:", err);
          }
        })(),
      ]);

      // Embed and upsert to Qdrant
      const embeddings = await embeddingService!.embedTexts(
        chunks.map((c) => c.pageContent)
      );
      await qdrantService!.upsertPageChunks(
        pageId,
        userId,
        title,
        chunks.map((c) => c.pageContent),
        embeddings,
        ancestorPath
      );
    } catch (err) {
      console.error("Embedding pipeline error:", err);
    }
  });
}

/**
 * POST /api/v1/pages
 * Create a new page with optional parentId.
 */
export const createPage = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, parentId } = req.body as CreatePageInput;
  const userId = req.userId!;

  // If parentId is provided, verify it belongs to the current user
  if (parentId) {
    const parent = await Page.findOne({ _id: parentId, userId });
    if (!parent) {
      throw new AppError("Parent page not found or does not belong to you.", 404);
    }
  }

  // Calculate order: place at end of sibling list
  const siblingCount = await Page.countDocuments({
    userId,
    parentId: parentId || null,
  });

  const page = await Page.create({
    title,
    content,
    parentId: parentId || null,
    userId,
    order: siblingCount,
  });

  // If content is provided at creation, index it
  if (content) {
    triggerIndexingPipeline(
      page._id.toString(),
      userId,
      page.title,
      page.content,
      page.tags
    );
  }

  res.status(201).json({
    success: true,
    page,
  });
});

/**
 * GET /api/v1/pages/tree
 * Return the full nested tree for the logged-in user in one call.
 * Fetches flat, builds tree server-side.
 */
export const getTree = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const pages = await Page.find({ userId })
    .select("title parentId order tags isPublic shareSlug createdAt updatedAt")
    .sort({ order: 1 })
    .lean();

  // Build tree server-side
  interface TreeNode {
    _id: string;
    title: string;
    parentId: string | null;
    order: number;
    tags: any[];
    isPublic: boolean;
    shareSlug: string | null;
    createdAt: Date;
    updatedAt: Date;
    children: TreeNode[];
  }

  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // First pass: create all nodes
  for (const page of pages) {
    nodeMap.set(page._id.toString(), {
      ...page,
      _id: page._id.toString(),
      parentId: page.parentId?.toString() ?? null,
      children: [],
    } as TreeNode);
  }

  // Second pass: build parent-child relationships
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  res.json({
    success: true,
    tree: roots,
  });
});

/**
 * GET /api/v1/pages/:id
 * Single page with full content.
 */
export const getPage = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.userId!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Page not found.", 404);
  }

  const page = await Page.findOne({ _id: id, userId }).lean();
  if (!page) {
    throw new AppError("Page not found.", 404);
  }

  // Build breadcrumb (ancestor titles)
  const breadcrumb: { id: string; title: string }[] = [];
  let currentId: string | null = page.parentId?.toString() ?? null;
  while (currentId) {
    const ancestor = await Page.findById(currentId).select("title parentId").lean();
    if (!ancestor) break;
    breadcrumb.unshift({ id: ancestor._id.toString(), title: ancestor.title });
    currentId = ancestor.parentId?.toString() ?? null;
  }

  res.json({
    success: true,
    page,
    breadcrumb,
  });
});

/**
 * PATCH /api/v1/pages/:id
 * Update title/content/order/parentId.
 * Triggers embedding + auto-tagging pipeline if content changed.
 */
export const updatePage = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.userId!;
  const updates = req.body as UpdatePageInput;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Page not found.", 404);
  }

  const page = await Page.findOne({ _id: id, userId });
  if (!page) {
    throw new AppError("Page not found.", 404);
  }

  // If moving to a new parent, verify the parent belongs to user
  if (updates.parentId !== undefined && updates.parentId !== null) {
    const parent = await Page.findOne({ _id: updates.parentId, userId });
    if (!parent) {
      throw new AppError("Parent page not found or does not belong to you.", 404);
    }
  }

  const contentChanged =
    updates.content !== undefined &&
    JSON.stringify(updates.content) !== JSON.stringify(page.content);

  // Apply updates
  if (updates.title !== undefined) page.title = updates.title;
  if (updates.content !== undefined) page.content = updates.content;
  if (updates.parentId !== undefined) page.parentId = updates.parentId as any;
  if (updates.order !== undefined) page.order = updates.order;

  await page.save();

  // Trigger embedding + auto-tagging pipeline (Phase 4)
  // This runs async — don't block the response
  if (contentChanged) {
    triggerIndexingPipeline(
      page._id.toString(),
      userId,
      page.title,
      page.content,
      page.tags
    );
  }

  res.json({
    success: true,
    page,
  });
});

/**
 * DELETE /api/v1/pages/:id
 * Cascade delete: recursively delete all descendants + their Qdrant vectors.
 */
export const deletePage = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.userId!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Page not found.", 404);
  }

  const page = await Page.findOne({ _id: id, userId });
  if (!page) {
    throw new AppError("Page not found.", 404);
  }

  // Collect all descendant IDs recursively
  const allIds: string[] = [id];
  async function collectDescendants(parentId: string) {
    const children = await Page.find({ parentId, userId }).select("_id").lean();
    for (const child of children) {
      allIds.push(child._id.toString());
      await collectDescendants(child._id.toString());
    }
  }
  await collectDescendants(id);

  // Delete all pages
  await Page.deleteMany({ _id: { $in: allIds }, userId });

  // Delete Qdrant vectors for all deleted pages (Phase 4)
  loadServices().then(async () => {
    if (!qdrantService) return;
    for (const pageId of allIds) {
      try {
        await qdrantService.deleteByPageId(pageId);
      } catch (err) {
        console.error(`Failed to delete Qdrant vectors for page ${pageId}:`, err);
      }
    }
  });

  res.json({
    success: true,
    message: `Deleted ${allIds.length} page(s)`,
    deletedIds: allIds,
  });
});

/**
 * PATCH /api/v1/pages/:id/share
 * Toggle sharing: generates shareSlug on first enable.
 */
export const updateShare = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.userId!;
  const { isPublic, includeSubpages } = req.body as SharePageInput;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Page not found.", 404);
  }

  const page = await Page.findOne({ _id: id, userId });
  if (!page) {
    throw new AppError("Page not found.", 404);
  }

  page.isPublic = isPublic;
  page.includeSubpagesInShare = includeSubpages;

  // Generate shareSlug on first enable (don't regenerate on re-enable)
  if (isPublic && !page.shareSlug) {
    page.shareSlug = nanoid(12);
  }

  await page.save();

  res.json({
    success: true,
    page: {
      _id: page._id,
      isPublic: page.isPublic,
      includeSubpagesInShare: page.includeSubpagesInShare,
      shareSlug: page.shareSlug,
    },
  });
});

/**
 * PATCH /api/v1/pages/:id/tags
 * Accept or reject a suggested tag.
 */
export const updateTags = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.userId!;
  const { name, action } = req.body as UpdateTagInput;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Page not found.", 404);
  }

  const page = await Page.findOne({ _id: id, userId });
  if (!page) {
    throw new AppError("Page not found.", 404);
  }

  if (action === "accept") {
    // Find the tag and change status to accepted
    const tag = page.tags.find((t) => t.name === name);
    if (tag) {
      tag.status = "accepted";
    } else {
      // Add new accepted tag
      page.tags.push({ name, status: "accepted" });
    }
  } else {
    // Remove the tag entirely
    page.tags = page.tags.filter((t) => t.name !== name);
  }

  await page.save();

  res.json({
    success: true,
    tags: page.tags,
  });
});
