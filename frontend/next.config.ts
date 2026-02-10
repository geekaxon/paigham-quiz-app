import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["*.pike.replit.dev", "*.replit.dev"],
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
