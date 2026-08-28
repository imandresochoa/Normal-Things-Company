import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/roots",
        destination: "/pulse",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
