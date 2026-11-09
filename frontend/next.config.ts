
import type { NextConfig } from "next";

const apiUrl = process.env.API_URL || "http://localhost:5184";
console.log(
     `[next.config] API_URL = ${process.env.API_URL ? apiUrl : "NOT SET, using fallback " + apiUrl}`
   );

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
