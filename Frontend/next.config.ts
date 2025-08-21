import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  serverExternalPackages: ['sqlite3'],
};

export default nextConfig;
