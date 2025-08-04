import type {NextConfig} from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Add some additional optimizations
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
