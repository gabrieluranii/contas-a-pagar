import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
