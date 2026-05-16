import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
