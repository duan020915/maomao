import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/maomao",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
