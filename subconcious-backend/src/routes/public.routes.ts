import { Router } from "express";
import { getSharedPage } from "../controllers/public.controller.js";

const router = Router();

// No auth required — public access
router.get("/pages/:shareSlug", getSharedPage);

export default router;
