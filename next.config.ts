import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.34", "172.20.10.2"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
