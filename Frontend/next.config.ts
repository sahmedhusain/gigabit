import { image } from "framer-motion/client";
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    domains: ['localhost', 'api.dicebear.com', 'randomuser.me', 'images.unsplash.com', 'media.giphy.com'],
    formats: ['image/webp', 'image/avif'],
  },
  serverExternalPackages: ['sqlite3'],
};

export default nextConfig;
