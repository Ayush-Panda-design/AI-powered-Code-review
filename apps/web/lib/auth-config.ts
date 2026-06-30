export function getAuthConfigErrors(): string[] {
  const errors: string[] = [];

  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    errors.push("BETTER_AUTH_SECRET is missing");
  } else if (secret.length < 32) {
    errors.push("BETTER_AUTH_SECRET must be at least 32 characters");
  }

  if (!process.env.DATABASE_URL?.trim()) {
    errors.push("DATABASE_URL is missing");
  }

  return errors;
}

/** GitHub OAuth is optional — email sign-in still works without it. */
export function getGitHubOAuthConfigErrors(): string[] {
  const errors: string[] = [];

  if (!process.env.GITHUB_CLIENT_ID?.trim()) {
    errors.push("GITHUB_CLIENT_ID is missing");
  }

  if (!process.env.GITHUB_CLIENT_SECRET?.trim()) {
    errors.push("GITHUB_CLIENT_SECRET is missing");
  }

  return errors;
}
