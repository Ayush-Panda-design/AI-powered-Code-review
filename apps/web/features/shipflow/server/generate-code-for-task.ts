import { generateText } from "ai";

import { getReviewModel, getReviewMaxOutputTokens } from "@/features/ai-sdk";

const CODEGEN_SYSTEM = `You are a senior software engineer. Generate a minimal, focused code change for a single engineering task.

Respond ONLY with valid JSON:
{
  "filePath": string,
  "content": string (full file content),
  "commitMessage": string,
  "prTitle": string,
  "prBody": string,
  "complexity": "low" | "medium" | "high",
  "summary": string
}

Keep changes small and reviewable. Prefer one file when possible.`;

export async function generateCodeForTask(input: {
  taskTitle: string;
  taskDescription: string;
  prdMarkdown: string;
  featureTitle: string;
}) {
  const model = getReviewModel();

  const { text } = await generateText({
    model,
    maxOutputTokens: getReviewMaxOutputTokens(),
    system: CODEGEN_SYSTEM,
    prompt: [
      `Feature: ${input.featureTitle}`,
      `Task: ${input.taskTitle}`,
      input.taskDescription ? `Description: ${input.taskDescription}` : "",
      `PRD:\n${input.prdMarkdown.slice(0, 6000)}`,
    ].join("\n\n"),
  });

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Codegen model did not return JSON");
  }

  return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
    filePath: string;
    content: string;
    commitMessage: string;
    prTitle: string;
    prBody: string;
    complexity: string;
    summary: string;
  };
}
