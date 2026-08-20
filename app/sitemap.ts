import type { MetadataRoute } from "next"
import { LANDING_URL } from "@/lib/constants"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: LANDING_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${LANDING_URL}/planos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
