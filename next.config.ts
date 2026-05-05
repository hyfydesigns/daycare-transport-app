import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  transpilePackages: ["mapbox-gl"],
};

export default nextConfig;
