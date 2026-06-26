import { httpLink } from "@repo/trpc/client";

export const createTRPCHttpBatchClientClient = () => {
  return httpLink({
    url: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc",
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
};
