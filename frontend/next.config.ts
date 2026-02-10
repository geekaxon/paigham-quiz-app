import type { NextConfig } from "next";

const backendPort = process.env.BACKEND_PORT || "3001";
const backendUrl = `http://localhost:${backendPort}`;

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["*.pike.replit.dev", "*.replit.dev"],
  async rewrites() {
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
