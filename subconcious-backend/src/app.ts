import express from "express";
import cors from "cors";
import passport from "./config/passport.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import pageRoutes from "./routes/page.routes.js";
import publicRoutes from "./routes/public.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

// CORS — allow the frontend origin with credentials
app.use(
  cors({
    origin: env.CLIENT_URL || "http://localhost:3001",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" })); // Tiptap JSON can be large
app.use(express.urlencoded({ extended: true }));

// Passport initialization (strategies are configured in config/passport.ts)
app.use(passport.initialize());

// Health check
app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Second Brain API is running" });
});

// ─── Routes ────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/pages", pageRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/chat", chatRoutes);

// ─── Error handling (must be last) ─────────────────────────────────
app.use(errorMiddleware);

export default app;
