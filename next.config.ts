import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    serverComponentsHmrCache: false,
  },
}

export default nextConfig
