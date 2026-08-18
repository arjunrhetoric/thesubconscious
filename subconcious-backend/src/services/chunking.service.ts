/**
 * Chunking service — converts Tiptap JSON to plain text and splits into chunks.
 * Uses a simple recursive character text splitter (no langchain dependency needed).
 */

/**
 * Recursively walk Tiptap JSON document and extract plain text.
 * Preserves line breaks between blocks.
 */
export function tiptapToPlainText(content: any): string {
  if (!content) return "";

  // Handle string content directly
  if (typeof content === "string") return content;

  // Tiptap JSON format: { type: "doc", content: [{ type: "paragraph", content: [...] }] }
  if (content.type === "text") {
    return content.text || "";
  }

  if (Array.isArray(content.content)) {
    const parts = content.content.map((node: any) => {
      if (node.type === "text") {
        return node.text || "";
      }

      // Block-level nodes get line breaks between them
      const innerText = tiptapToPlainText(node);

      // Headings get extra emphasis
      if (node.type === "heading") {
        return `\n${innerText}\n`;
      }

      // List items
      if (node.type === "listItem" || node.type === "taskItem") {
        const checked =
          node.type === "taskItem" ? (node.attrs?.checked ? "[x] " : "[ ] ") : "- ";
        return `${checked}${innerText}`;
      }

      // Code blocks
      if (node.type === "codeBlock") {
        return `\n\`\`\`\n${innerText}\n\`\`\`\n`;
      }

      return innerText;
    });

    // Join block-level elements with newlines
    const blockTypes = [
      "paragraph",
      "heading",
      "bulletList",
      "orderedList",
      "taskList",
      "codeBlock",
      "blockquote",
      "table",
      "horizontalRule",
      "image",
    ];

    if (content.type && blockTypes.includes(content.type)) {
      return parts.join("");
    }

    // For doc-level or list-level, join with newlines
    return parts.join("\n");
  }

  // Handle content array directly
  if (Array.isArray(content)) {
    return content.map((node: any) => tiptapToPlainText(node)).join("\n");
  }

  return "";
}

interface TextChunk {
  pageContent: string;
  index: number;
}

/**
 * Simple recursive character text splitter.
 * Splits text into chunks of approximately `chunkSize` characters
 * with `overlap` characters of overlap between chunks.
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanText = text.trim();

  // If text is shorter than chunk size, return as single chunk
  if (cleanText.length <= chunkSize) {
    return [{ pageContent: cleanText, index: 0 }];
  }

  const chunks: TextChunk[] = [];
  const separators = ["\n\n", "\n", ". ", " "];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = Math.min(startIndex + chunkSize, cleanText.length);

    // If not at the end, try to find a good split point
    if (endIndex < cleanText.length) {
      let bestSplit = endIndex;

      for (const sep of separators) {
        const lastSep = cleanText.lastIndexOf(sep, endIndex);
        if (lastSep > startIndex + chunkSize * 0.3) {
          bestSplit = lastSep + sep.length;
          break;
        }
      }

      endIndex = bestSplit;
    }

    const chunk = cleanText.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push({ pageContent: chunk, index: chunkIndex++ });
    }

    // Move start forward, accounting for overlap
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}
