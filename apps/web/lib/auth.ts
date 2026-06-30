import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@repo/database";

import { getAuthConfigErrors } from "@/lib/auth-config";
import {
  getAuthAllowedHosts,
  getAuthBaseUrl,
  getAuthProtocol,
  getAuthTrustedOrigins,
} from "@/lib/auth-env";

const githubClientId = process.env.GITHUB_CLIENT_ID?.trim();
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

const authConfigErrors = getAuthConfigErrors();
if (authConfigErrors.length > 0 && process.env.NODE_ENV === "development") {
  console.warn("[auth] configuration issues:", authConfigErrors.join("; "));
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: {
    allowedHosts: getAuthAllowedHosts(),
    protocol: getAuthProtocol(),
    fallback: getAuthBaseUrl(),
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : {}),
  },
  trustedOrigins: getAuthTrustedOrigins(),
  onAPIError: {
    errorURL: "/sign-in",
  },
  plugins: [nextCookies()],
});
