import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.barq.app",
        port: "",
        pathname: "/image/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
