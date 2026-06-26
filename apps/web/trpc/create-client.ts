import { httpLink } from "@repo/trpc/client";

function getTrpcUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/trpc`;
  }

  return "http://localhost:3000/api/trpc";
}

export const createTRPCHttpBatchClientClient = () => {
  return httpLink({
    url: getTrpcUrl(),
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
};
