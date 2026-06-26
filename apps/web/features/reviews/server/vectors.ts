import { getPineconeIndex } from "@/features/pinecone/client";
import type { CodeChunk } from "@/features/reviews/utils/chunk-code";

export function buildPrNamespace(repoFullName: string, prNumber: number) {
  return `${repoFullName.replaceAll("/", "--")}--pr-${prNumber}`;
}

export async function saveChunksToPinecone(
  namespace: string,
  chunks: CodeChunk[]
) {
  if (chunks.length === 0) {
    return;
  }

  const index = getPineconeIndex();
  const ns = index.namespace(namespace);

  await ns.upsertRecords({
    records: chunks.map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
      filePath: chunk.filePath,
    })),
  });
}

export type RetrievedChunk = {
  id: string;
  text: string;
  filePath: string;
  score?: number;
};

export async function searchPrContext(
  namespace: string,
  query: string,
  topK = 10
): Promise<RetrievedChunk[]> {
  const index = getPineconeIndex();
  const response = await index.namespace(namespace).searchRecords({
    query: {
      topK,
      inputs: { text: query },
    },
    fields: ["text", "filePath"],
  });

  const hits = response.result?.hits ?? [];

  const chunks: RetrievedChunk[] = [];

  for (const hit of hits) {
    const fields = hit.fields as Record<string, unknown>;
    const text = typeof fields.text === "string" ? fields.text : "";
    const filePath =
      typeof fields.filePath === "string" ? fields.filePath : "unknown";

    if (!text) {
      continue;
    }

    chunks.push({
      id: hit._id,
      text,
      filePath,
      score: hit._score,
    });
  }

  return chunks;
}
