import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Mark packages that should use Node.js runtime, not edge
  serverExternalPackages: ['unpdf'],
};

export default nextConfig;
