import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function createWebTrpcContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return { userId: session?.user?.id ?? null };
}
