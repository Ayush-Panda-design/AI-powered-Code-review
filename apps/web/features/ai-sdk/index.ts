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
