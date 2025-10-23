import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    domains: ['localhost', 'api.dicebear.com'],
    formats: ['image/webp', 'image/avif'],
  },
  serverExternalPackages: ['sqlite3'],
};

export default nextConfig;
