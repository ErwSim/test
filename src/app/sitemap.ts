import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://annoncia.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/generate", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/legal/mentions-legales", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/legal/cgu", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/legal/cgv", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/legal/confidentialite", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return staticPaths.map((s) => ({
    url: `${BASE_URL}${s.path}`,
    lastModified: now,
    changeFrequency: s.changeFrequency,
    priority: s.priority,
  }));
}
