import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meterkit.juanchi.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/demo", "/pilots"].map((path, index) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.8,
  }));
}
