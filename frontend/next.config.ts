import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5184", pathname: "/uploads/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5184/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5184/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
