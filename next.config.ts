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
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
};

export default nextConfig;
