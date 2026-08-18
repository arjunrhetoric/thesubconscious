import { Router } from "express";
import { userMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createPageSchema,
  updatePageSchema,
  sharePageSchema,
  updateTagSchema,
} from "../validators/page.validator.js";
import {
  createPage,
  getTree,
  getPage,
  updatePage,
  deletePage,
  updateShare,
  updateTags,
} from "../controllers/page.controller.js";

const router = Router();

// All page routes require authentication
router.use(userMiddleware);

router.post("/", validate(createPageSchema), createPage);
router.get("/tree", getTree);
router.get("/:id", getPage);
router.patch("/:id", validate(updatePageSchema), updatePage);
router.delete("/:id", deletePage);
router.patch("/:id/share", validate(sharePageSchema), updateShare);
router.patch("/:id/tags", validate(updateTagSchema), updateTags);

export default router;
