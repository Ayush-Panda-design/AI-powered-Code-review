import { generateText } from "ai";

import { getCodegenMaxOutputTokens, getCodegenModel } from "@/features/ai-sdk";

const CODEGEN_SYSTEM = `You are a senior software engineer. Generate a minimal, focused code change for a single engineering task.

Respond ONLY with a single valid JSON object (no prose, no markdown fences) with this exact shape:
{
  "filePath": string,        // the single file to create or change
  "content": string,         // the FULL file content
  "commitMessage": string,   // concise commit message
  "prTitle": string,         // short PR title
  "prBody": string,          // short PR description (markdown)
  "complexity": "low" | "medium" | "high",
  "summary": string          // one sentence describing the change
}

Keep changes small and reviewable. Prefer one file when possible.`;

export type GeneratedCode = {
  filePath: string;
  content: string;
  commitMessage: string;
  prTitle: string;
  prBody: string;
  complexity: string;
  summary: string;
};

type GenerateCodeInput = {
  taskTitle: string;
  taskDescription: string;
  prdMarkdown: string;
  featureTitle: string;
};

function buildPrompt(input: GenerateCodeInput) {
  return [
    `Feature: ${input.featureTitle}`,
    `Task: ${input.taskTitle}`,
    input.taskDescription ? `Description: ${input.taskDescription}` : "",
    `PRD:\n${input.prdMarkdown.slice(0, 6000)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function extractJsonObject(text: string): string {
  let candidate = text.trim();

  // Strip ```json ... ``` fences if the model added them.
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    candidate = fenced[1].trim();
  }

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      "The AI did not return code in the expected format. Please try generating again.",
    );
  }

  return candidate.slice(start, end + 1);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function generateCodeForTask(
  input: GenerateCodeInput,
): Promise<GeneratedCode> {
  const model = getCodegenModel();

  const { text } = await generateText({
    model,
    maxOutputTokens: getCodegenMaxOutputTokens(),
    system: CODEGEN_SYSTEM,
    prompt: buildPrompt(input),
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(extractJsonObject(text)) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        "The AI response could not be parsed as code (it may have been cut off). Try generating again.",
      );
    }
    throw error;
  }

  const filePath = asString(parsed.filePath).trim();
  const content = asString(parsed.content);

  if (!filePath || !content) {
    throw new Error(
      "The AI response was missing the file path or content. Try generating again.",
    );
  }

  const prTitle = asString(parsed.prTitle).trim() || input.taskTitle;

  return {
    filePath,
    content,
    commitMessage:
      asString(parsed.commitMessage).trim() || `Add ${filePath}`,
    prTitle,
    prBody: asString(parsed.prBody).trim() || prTitle,
    complexity: asString(parsed.complexity).trim() || "medium",
    summary:
      asString(parsed.summary).trim() ||
      `AI-generated change for: ${input.taskTitle}`,
  };
}
