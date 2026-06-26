function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function getAuthBaseUrl() {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    "http://localhost:3000"
  );
}

export function getAuthTrustedOrigins() {
  const origins = new Set<string>();
  const baseUrl = parseUrl(getAuthBaseUrl());

  if (baseUrl) {
    origins.add(baseUrl.origin);
  }

  const extra = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [];
  for (const entry of extra) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const parsed = parseUrl(trimmed);
    origins.add(parsed?.origin ?? trimmed);
  }

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:3001");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://127.0.0.1:3001");
  }

  return unique([...origins]);
}

export function getAuthAllowedHosts() {
  const hosts = new Set<string>();

  for (const origin of getAuthTrustedOrigins()) {
    const parsed = parseUrl(origin);
    if (parsed) {
      hosts.add(parsed.host);
    }
  }

  return unique([...hosts]);
}

export function getAuthProtocol(): "http" | "https" {
  const baseUrl = parseUrl(getAuthBaseUrl());
  return baseUrl?.protocol === "https:" ? "https" : "http";
}
