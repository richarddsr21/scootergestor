import type { MetadataRoute } from "next"
import { LANDING_URL } from "@/lib/constants"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/onboarding", "/aceitar-convite", "/acompanhar/", "/assinatura"],
    },
    sitemap: `${LANDING_URL}/sitemap.xml`,
  }
}
