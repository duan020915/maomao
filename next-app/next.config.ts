import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  devIndicators: false,
  basePath: "/maomao",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
