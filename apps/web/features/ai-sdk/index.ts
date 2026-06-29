import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getOpenRouterConfigError(): string | null {
  if (!readEnv("OPENROUTER_API_KEY")) {
    return "OPENROUTER_API_KEY is missing.";
  }

  return null;
}

export function getOpenRouter() {
  const apiKey = readEnv("OPENROUTER_API_KEY");
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  return createOpenRouter({ apiKey });
}

export function getReviewModel() {
  const openrouter = getOpenRouter();
  const model =
    readEnv("OPENROUTER_MODEL") ?? "google/gemini-2.5-flash-lite";
  return openrouter(model);
}

/**
 * Dedicated model for AI code generation.
 * - If GEMINI_API_KEY is set → calls Gemini 2.5 Flash directly (fastest).
 * - Otherwise → falls back to OpenRouter with gemini-2.5-flash (still works,
 *   just routed through OpenRouter).
 * Override the model with CODEGEN_MODEL in .env.
 */
export function getCodegenModel() {
  const geminiKey =
    readEnv("GEMINI_API_KEY") ?? readEnv("GOOGLE_GENERATIVE_AI_API_KEY");

  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    const model = readEnv("CODEGEN_MODEL") ?? "gemini-2.5-flash";
    return google(model);
  }

  // Fallback: route through OpenRouter
  const openrouter = getOpenRouter();
  const model =
    readEnv("CODEGEN_MODEL") ??
    readEnv("OPENROUTER_MODEL") ??
    "google/gemini-2.5-flash";
  return openrouter(model);
}

export function getReviewMaxOutputTokens() {
  const configured = readEnv("OPENROUTER_MAX_TOKENS");
  if (configured) {
    const parsed = Number.parseInt(configured, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Keep low so OpenRouter free-tier credit checks pass (default model max is 65k).
  return 2_048;
}

/**
 * Code generation needs a much larger budget than reviews because it returns a
 * whole source file. The review cap (2k) truncates the JSON and makes parsing
 * fail, which is why every generation was failing.
 */
export function getCodegenMaxOutputTokens() {
  const configured = readEnv("OPENROUTER_CODEGEN_MAX_TOKENS");
  if (configured) {
    const parsed = Number.parseInt(configured, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 8_192;
}

/** Fast model for task breakdown — prefers direct Gemini when configured. */
export function getTasksModel() {
  return getCodegenModel();
}

/** Task lists are shorter than full source files — keep the cap lower for speed. */
export function getTasksMaxOutputTokens() {
  const configured = readEnv("OPENROUTER_TASKS_MAX_TOKENS");
  if (configured) {
    const parsed = Number.parseInt(configured, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 4_096;
}
