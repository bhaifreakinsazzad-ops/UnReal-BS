import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'msgsndr-private.storage.googleapis.com' },
      { protocol: 'https', hostname: '*.storage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
};

export default nextConfig;
