import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { embedQuery } from "../services/embedding.service.js";
import { searchSimilar } from "../services/qdrant.service.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { AppError } from "../middleware/error.middleware.js";
import { env } from "../config/env.js";
import type { ChatInput } from "../validators/chat.validator.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * POST /api/v1/chat
 * RAG chat endpoint with SSE streaming.
 * 1. Embed the user's message
 * 2. Search Qdrant for relevant chunks (filtered by userId + optional scope)
 * 3. Build prompt with retrieved context
 * 4. Stream gemini-2.0-flash response token-by-token via SSE
 * 5. Send final event with source citations
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message, scope } = req.body as ChatInput;
  const userId = req.userId!;

  // 1. Embed the incoming message
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedQuery(message);
  } catch (error) {
    throw new AppError("Failed to process your message. Please try again.", 500);
  }

  // 2. Query Qdrant for relevant chunks
  const scopePageId = scope === "all" ? undefined : scope;
  let results: Array<{ pageId: string; pageTitle: string; chunkText: string; score?: number }> = [];
  try {
    results = await searchSimilar(queryEmbedding, userId, scopePageId, 5);
  } catch (error) {
    // Qdrant might not have the collection yet, return empty context
    console.error("Qdrant search error:", error);
    results = [];
  }

  // 3. Build context from retrieved chunks
  const contextBlocks = results.map(
    (r, i) =>
      `[Source ${i + 1}: "${r.pageTitle}"]\n${r.chunkText}`
  );
  const context = contextBlocks.join("\n\n---\n\n");

  // Deduplicate sources by pageId
  const sourceMap = new Map<string, string>();
  for (const r of results) {
    if (!sourceMap.has(r.pageId)) {
      sourceMap.set(r.pageId, r.pageTitle);
    }
  }
  const sources = Array.from(sourceMap.entries()).map(([pageId, pageTitle]) => ({
    pageId,
    pageTitle,
  }));

  // Build the prompt
  const systemPrompt = `You are Subconscious Brain AI, a helpful assistant that answers questions based ONLY on the user's notes. You have access to relevant excerpts from their note-taking app.

RULES:
- Answer ONLY based on the provided context from the user's notes.
- If the notes don't contain enough information to answer, say "I don't have enough information in your notes to answer that."
- Be concise and direct.
- When referencing information, naturally mention which note it comes from.
- Do NOT make up information that isn't in the provided context.

${context ? `CONTEXT FROM USER'S NOTES:\n\n${context}` : "No relevant notes found for this query."}`;

  // 4. Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();

  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let streamed = false;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContentStream({
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nUser question: ${message}` }] },
        ],
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
        }
      }

      // Send final event with sources
      res.write(
        `data: ${JSON.stringify({ done: true, sources })}\n\n`
      );
      streamed = true;
      break;
    } catch (error: any) {
      if (error?.status === 503 || error?.status === 429 || error?.message?.includes("503") || error?.message?.includes("429")) {
        console.warn(`Model ${modelName} busy, falling back...`);
        continue;
      }
      console.error(`Chat streaming error with ${modelName}:`, error);
    }
  }

  if (!streamed) {
    res.write(
      `data: ${JSON.stringify({
        token: "\n\n⚠️ AI service is momentarily experiencing high demand. Please try again in a few seconds.",
      })}\n\n`
    );
    res.write(`data: ${JSON.stringify({ done: true, sources: [] })}\n\n`);
  }

  res.end();
});
