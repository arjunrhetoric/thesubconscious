import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureCollection } from "./services/qdrant.service.js";
import app from "./app.js";

async function main() {
  await connectDB();

  // Ensure Qdrant collection exists (creates if missing)
  try {
    await ensureCollection();
  } catch (error) {
    console.warn("⚠️ Qdrant collection setup failed (will retry on first use):", error);
  }

  app.listen(Number(env.PORT), () => {
    console.log(`🧠 Second Brain API running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
