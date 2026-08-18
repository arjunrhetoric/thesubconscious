import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Embed multiple texts using Gemini's text-embedding-004 model.
 * Returns array of number arrays (embedding vectors).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

  const embeddings: number[][] = [];

  // Embed individually or in batches
  for (const text of texts) {
    const result = await model.embedContent({
      content: { parts: [{ text }], role: "user" },
      outputDimensionality: 768,
    } as any);
    embeddings.push(result.embedding.values);
  }

  return embeddings;
}

/**
 * Embed a single query text for similarity search.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent({
    content: { parts: [{ text }], role: "user" },
    outputDimensionality: 768,
  } as any);
  return result.embedding.values;
}
