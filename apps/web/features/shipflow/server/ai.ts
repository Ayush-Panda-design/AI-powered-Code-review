import { generateText } from "ai";

import {
  getCodegenMaxOutputTokens,
  getReviewModel,
  getReviewMaxOutputTokens,
  getTasksModel,
  getTasksMaxOutputTokens,
} from "@/features/ai-sdk";

const PRD_SYSTEM = `You are a senior product manager. Generate a structured PRD from a feature request.
Respond ONLY with valid JSON matching this shape:
{
  "problemStatement": string,
  "goals": string,
  "nonGoals": string,
  "userStories": string (markdown list),
  "acceptanceCriteria": string (markdown checklist),
  "edgeCases": string,
  "successMetrics": string,
  "rawMarkdown": string (full PRD in markdown)
}`;

export async function generatePrdFromRequest(title: string, description: string, clarifications: string) {
  const model = getReviewModel();

  const { text } = await generateText({
    model,
    maxOutputTokens: getCodegenMaxOutputTokens(),
    system: PRD_SYSTEM,
    prompt: `Feature: ${title}\n\nDescription:\n${description}\n\nClarifications:\n${clarifications || "None"}`,
  });

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("PRD model did not return JSON");
  }

  return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
    problemStatement: string;
    goals: string;
    nonGoals: string;
    userStories: string;
    acceptanceCriteria: string;
    edgeCases: string;
    successMetrics: string;
    rawMarkdown: string;
  };
}

const TASKS_SYSTEM = `You are an engineering lead. Break a PRD into actionable engineering tasks.
Rules:
- Return 5 to 10 tasks maximum — keep each title under 80 characters.
- Prefer fewer, larger tasks over many tiny ones.
- Respond ONLY with a JSON array: [{ "title": string, "description": string, "priority": "low"|"medium"|"high" }]`;

export async function generateTasksFromPrd(prdMarkdown: string) {
  const model = getTasksModel();

  const { text } = await generateText({
    model,
    maxOutputTokens: getTasksMaxOutputTokens(),
    system: TASKS_SYSTEM,
    prompt: prdMarkdown.slice(0, 5000),
  });

  // Strip optional ```json fences before parsing
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? text.trim();

  const jsonStart = raw.indexOf("[");
  const jsonEnd = raw.lastIndexOf("]");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Task model did not return a JSON array. Try again.");
  }

  return JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Array<{
    title: string;
    description: string;
    priority: string;
  }>;
}

const CLARIFY_SYSTEM = `You are a product discovery agent helping a developer clarify a feature request.

Rules:
1. Read ALL previous conversation turns before responding — never repeat a question already asked or answered.
2. If the conversation history shows answers, use those answers to ask smarter follow-up questions, not the same ones again.
3. Ask at most 2-3 NEW questions that are still genuinely unclear.
4. If the request AND previous answers together give enough context, say so clearly and tell the user they can now click "Generate PRD".
5. When a repository is provided, ask questions that are SPECIFIC to that codebase (e.g. "Should this use your existing Tailwind/Next.js setup?" not "What framework do you want?").
6. When similar existing features are found, name them, explain the overlap, and suggest extending instead of duplicating.
7. Keep questions concise and numbered.`;

export type ClarificationMessage = { role: string; content: string };

export async function generateClarificationQuestions(
  title: string,
  description: string,
  options: {
    previousMessages?: ClarificationMessage[];
    repoContext?: string;
    similarFeaturesContext?: string;
  } = {},
) {
  const model = getReviewModel();
  const { previousMessages = [], repoContext = "", similarFeaturesContext = "" } = options;

  const historyBlock =
    previousMessages.length > 0
      ? [
          "## Conversation so far",
          ...previousMessages.map(
            (m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`,
          ),
          "",
        ].join("\n")
      : "";

  const prompt = [
    repoContext,
    similarFeaturesContext,
    `## Feature Request`,
    `Title: ${title}`,
    `Description: ${description}`,
    "",
    historyBlock,
    previousMessages.length > 0
      ? "Based on the conversation above, what is still unclear? Do NOT repeat already-answered questions."
      : "What clarifying questions do you need to ask?",
  ]
    .filter(Boolean)
    .join("\n");

  const { text } = await generateText({
    model,
    maxOutputTokens: 1024,
    system: CLARIFY_SYSTEM,
    prompt,
  });

  return text.trim();
}
