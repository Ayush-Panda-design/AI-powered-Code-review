import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/trpc", "@repo/database", "@repo/services"],
};

export default nextConfig;
