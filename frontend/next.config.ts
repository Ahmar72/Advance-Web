import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typedRoutes: true,

  images: {
    remotePatterns: [
      {
        hostname: "avatars.githubusercontent.com",
        port: "",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
