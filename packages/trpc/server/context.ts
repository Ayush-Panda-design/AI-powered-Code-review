import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/database";

export type TrpcContext = {
  userId: string | null;
};

function parseSessionToken(cookieHeader: string | undefined) {
  if (!cookieHeader) return null;

  const cookieNames = [
    "better-auth.session_token=",
    "__Secure-better-auth.session_token=",
  ];

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const cookie of cookies) {
    for (const prefix of cookieNames) {
      if (cookie.startsWith(prefix)) {
        const raw = decodeURIComponent(cookie.slice(prefix.length));
        return raw.split(".")[0] ?? raw;
      }
    }
  }

  return null;
}

export async function createContext(opts?: {
  req?: { headers: Record<string, string | string[] | undefined> };
}): Promise<TrpcContext> {
  const cookieHeader = opts?.req?.headers?.cookie;
  const cookie =
    typeof cookieHeader === "string" ? cookieHeader : cookieHeader?.[0];

  const token = parseSessionToken(cookie);
  if (!token) {
    return { userId: null };
  }

  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return { userId: null };
  }

  return { userId: session.userId };
}

export function requireUser(ctx: TrpcContext) {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }

  return ctx.userId;
}
