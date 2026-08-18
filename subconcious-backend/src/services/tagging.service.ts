import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Use gemini-2.0-flash to suggest 2-4 topic tags for a given text.
 * Returns a string array of tag names.
 * Handles LLM output quirks (markdown fences, invalid JSON).
 */
export async function suggestTags(plainText: string): Promise<string[]> {
  if (!plainText || plainText.trim().length < 20) {
    return [];
  }

  // Truncate very long texts to save tokens
  const truncated = plainText.slice(0, 3000);

  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const prompt = `You are a topic tagging assistant. Given the following note content, return exactly 2-4 short, lowercase topic tags as a JSON array of strings. Return ONLY the JSON array, nothing else. No markdown, no explanation.

Example output: ["machine-learning", "python", "data-science"]

Note content:
${truncated}`;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text().trim();

      // Strip markdown code fences if present
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      text = text.trim();

      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        continue;
      }

      // Validate: filter to only strings, lowercase, limit length
      return parsed
        .filter((tag: any) => typeof tag === "string" && tag.length > 0)
        .map((tag: string) =>
          tag
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        )
        .filter((tag: string) => tag.length > 0)
        .slice(0, 4);
    } catch (error: any) {
      // Try next model if 503 / 429
      if (error?.status === 503 || error?.status === 429 || error?.message?.includes("503") || error?.message?.includes("429")) {
        continue;
      }
      console.error(`Auto-tagging error with ${modelName}:`, error);
    }
  }

  return [];
}
