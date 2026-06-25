import { generateText } from "ai";

import { getReviewModel, getReviewMaxOutputTokens } from "@/features/ai-sdk";
import type { RetrievedChunk } from "@/features/reviews/server/vectors";

const REVIEW_SYSTEM_PROMPT = `You are an expert code reviewer. Review the pull request changes for:
- Correctness and logic bugs
- Security vulnerabilities
- Performance issues
- Code quality and maintainability

Be specific and actionable. Reference file paths when relevant.
Format the review in Markdown with clear sections.
If the changes look good, say so briefly and mention any minor suggestions.`;

const MAX_CHUNK_CHARS = 2_000;
const MAX_TOTAL_CONTEXT_CHARS = 12_000;

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, maxChars)}\n... [truncated]`;
}

function formatContext(chunks: RetrievedChunk[]) {
  if (chunks.length === 0) {
    return "No diff context available.";
  }

  const sections: string[] = [];
  let totalChars = 0;

  for (const [index, chunk] of chunks.entries()) {
    const body = truncateText(chunk.text, MAX_CHUNK_CHARS);
    const section = `### Context ${index + 1}: ${chunk.filePath}\n\`\`\`diff\n${body}\n\`\`\``;

    if (totalChars + section.length > MAX_TOTAL_CONTEXT_CHARS) {
      sections.push(
        `_Additional diff context omitted to stay within model limits._`
      );
      break;
    }

    sections.push(section);
    totalChars += section.length;
  }

  return sections.join("\n\n");
}

export async function generateReview(
  title: string,
  contextChunks: RetrievedChunk[]
) {
  const model = getReviewModel();
  const context = formatContext(contextChunks);

  const { text } = await generateText({
    model,
    maxOutputTokens: getReviewMaxOutputTokens(),
    system: REVIEW_SYSTEM_PROMPT,
    prompt: `Review this pull request.

**Title:** ${title}

**Relevant diff context (retrieved via semantic search):**

${context}

Provide a concise but thorough code review.`,
  });

  return text.trim();
}
