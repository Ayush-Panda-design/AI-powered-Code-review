function parseCorsOrigins() {
  const origins = new Set([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ]);

  const extra = process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [];
  for (const entry of extra) {
    const trimmed = entry.trim();
    if (trimmed) origins.add(trimmed);
  }

  const authUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  if (authUrl) {
    try {
      origins.add(new URL(authUrl).origin);
    } catch {
      // ignore invalid URL
    }
  }

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  return [...origins];
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: process.env.API_PORT ?? "8000",
  BASE_URL: process.env.API_BASE_URL ?? "http://localhost:8000",
  CORS_ALLOWED_ORIGINS: parseCorsOrigins(),
};
