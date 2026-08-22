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
  async redirects() {
    return [
      { source: "/planos", destination: "/#planos", permanent: true },
      { source: "/contato", destination: "/#contato", permanent: true },
      {
        source: "/demo",
        destination:
          "https://wa.me/5521988729352?text=Ol%C3%A1!%20Tenho%20uma%20loja%20de%20scooters%20el%C3%A9tricas%20e%20quero%20agendar%20uma%20demonstra%C3%A7%C3%A3o%20do%20ScooterGestor.",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
