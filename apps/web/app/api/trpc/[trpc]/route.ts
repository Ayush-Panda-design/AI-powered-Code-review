import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { serverRouter } from "@repo/trpc/server";

import { isSameOriginRequest, sameOriginForbiddenResponse } from "@/lib/same-origin";
import { createWebTrpcContext } from "@/trpc/context";

const handler = (req: Request) => {
  if (!isSameOriginRequest(req)) {
    return sameOriginForbiddenResponse();
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: serverRouter,
    createContext: createWebTrpcContext,
  });
};

export { handler as GET, handler as POST };
