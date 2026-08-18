import { qdrantClient, QDRANT_COLLECTION } from "../config/qdrant.js";
import crypto from "crypto";

// text-embedding-004 produces 768-dimensional vectors
const VECTOR_SIZE = 768;

/**
 * Generate a deterministic UUID v5 from a string (for Qdrant point IDs).
 * This allows us to cleanly overwrite old chunks when re-saving a page.
 */
function deterministicUUID(input: string): string {
  const hash = crypto.createHash("md5").update(input).digest("hex");
  // Format as UUID
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join("-");
}

/**
 * Ensure the Qdrant collection exists with the correct vector config.
 */
export async function ensureCollection(): Promise<void> {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === QDRANT_COLLECTION
    );

    if (!exists) {
      await qdrantClient.createCollection(QDRANT_COLLECTION, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      console.log(`✅ Created Qdrant collection: ${QDRANT_COLLECTION}`);

      // Create payload indexes for filtering
      await qdrantClient.createPayloadIndex(QDRANT_COLLECTION, {
        field_name: "userId",
        field_schema: "keyword",
      });
      await qdrantClient.createPayloadIndex(QDRANT_COLLECTION, {
        field_name: "pageId",
        field_schema: "keyword",
      });
      await qdrantClient.createPayloadIndex(QDRANT_COLLECTION, {
        field_name: "ancestorPath",
        field_schema: "keyword",
      });
    }
  } catch (error) {
    console.error("Failed to ensure Qdrant collection:", error);
    throw error;
  }
}

/**
 * Upsert page chunks into Qdrant.
 * Uses deterministic point IDs so re-saving cleanly overwrites old chunks.
 * Deletes all existing points for the page first, then inserts new ones.
 */
export async function upsertPageChunks(
  pageId: string,
  userId: string,
  pageTitle: string,
  chunks: string[],
  embeddings: number[][],
  ancestorPath: string[]
): Promise<void> {
  // First, delete all existing points for this page
  await deleteByPageId(pageId);

  if (chunks.length === 0) return;

  // Build points with deterministic IDs
  const points = chunks.map((chunkText, index) => ({
    id: deterministicUUID(`${pageId}_${index}`),
    vector: embeddings[index]!,
    payload: {
      userId,
      pageId,
      pageTitle,
      chunkText,
      chunkIndex: index,
      ancestorPath,
      createdAt: new Date().toISOString(),
    },
  }));

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    await qdrantClient.upsert(QDRANT_COLLECTION, {
      wait: true,
      points: batch,
    });
  }
}

/**
 * Delete all points for a given page ID.
 */
export async function deleteByPageId(pageId: string): Promise<void> {
  try {
    await qdrantClient.delete(QDRANT_COLLECTION, {
      wait: true,
      filter: {
        must: [
          {
            key: "pageId",
            match: { value: pageId },
          },
        ],
      },
    });
  } catch (error) {
    // Collection might not exist yet on first run
    console.error(`Failed to delete Qdrant points for page ${pageId}:`, error);
  }
}

/**
 * Search for similar chunks in Qdrant.
 * Always filters by userId for multi-tenant isolation.
 * Optionally filters by ancestorPath for page-scoped search.
 */
export async function searchSimilar(
  embedding: number[],
  userId: string,
  scopePageId?: string,
  topK: number = 5
): Promise<
  Array<{
    pageId: string;
    pageTitle: string;
    chunkText: string;
    score: number;
  }>
> {
  const filter: any = {
    must: [
      {
        key: "userId",
        match: { value: userId },
      },
    ],
  };

  // If scoped to a specific page subtree, filter by ancestorPath
  if (scopePageId && scopePageId !== "all") {
    filter.must.push({
      key: "ancestorPath",
      match: { value: scopePageId },
    });
  }

  const response = await qdrantClient.query(QDRANT_COLLECTION, {
    query: embedding,
    limit: topK,
    filter,
    with_payload: true,
  });

  const points = response.points || [];

  return points.map((result) => ({
    pageId: (result.payload as any).pageId as string,
    pageTitle: (result.payload as any).pageTitle as string,
    chunkText: (result.payload as any).chunkText as string,
    score: result.score || 0,
  }));
}
