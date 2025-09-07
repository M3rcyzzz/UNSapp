import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 确保在Vercel上正确构建
  trailingSlash: false,
};

export default nextConfig;
