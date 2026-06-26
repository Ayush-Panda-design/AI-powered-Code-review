import { getOpenRouterConfigError } from "@/features/ai-sdk";
import { getPineconeConfigError } from "@/features/pinecone/client";

export function getReviewPipelineConfigErrors(): string[] {
  const errors: string[] = [];

  const pineconeError = getPineconeConfigError();
  if (pineconeError) {
    errors.push(pineconeError);
  }

  const openRouterError = getOpenRouterConfigError();
  if (openRouterError) {
    errors.push(openRouterError);
  }

  return errors;
}

export function isReviewPipelineConfigured() {
  return getReviewPipelineConfigErrors().length === 0;
}
