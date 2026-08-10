import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://meterkit.juanchi.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const documentation = [
    "",
    "/concepts",
    "/agent-budgets",
    "/integrations",
    "/operations",
    "/reference",
    "/trust",
  ].flatMap((path) => [`/en/docs${path}`, `/es/docs${path}`]);
  return ["/", "/demo", "/pilots", ...documentation].map((path, index) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : path.includes("/docs") ? 0.7 : 0.8,
  }));
}
