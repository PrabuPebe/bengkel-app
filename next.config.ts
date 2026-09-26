import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/inventory/parts",
        destination: "/inventory/services",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
