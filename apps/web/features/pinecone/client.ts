import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getPineconeConfigError(): string | null {
  if (!readEnv("PINECONE_API_KEY")) {
    return "PINECONE_API_KEY is missing.";
  }

  if (!readEnv("PINECONE_INDEX")) {
    return "PINECONE_INDEX is missing.";
  }

  return null;
}

export function getPinecone() {
  const apiKey = readEnv("PINECONE_API_KEY");
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not set");
  }

  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey });
  }

  return pineconeClient;
}

export function getPineconeIndex() {
  const indexName = readEnv("PINECONE_INDEX");
  if (!indexName) {
    throw new Error("PINECONE_INDEX is not set");
  }

  return getPinecone().index(indexName);
}
