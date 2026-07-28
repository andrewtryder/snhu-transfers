import { MetadataRoute } from "next";
import { connection } from "next/server";
import { slugify } from "@/lib/slug";
import { siteUrl } from "@/lib/site";
import {
  getDistinctCourseNumbers,
  getDistinctLevels,
  getDistinctOrganizations,
  getDistinctSubjects,
  getTransferLastModified,
} from "@/lib/seoQueries";

export function getStaticSitemapRoutes(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/browse`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/courses`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/subjects`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/organizations`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/levels`, changeFrequency: "weekly", priority: 0.7 },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const staticRoutes = getStaticSitemapRoutes();

  try {
    const [lastModified, subjects, organizations, levels, courses] = await Promise.all([
      getTransferLastModified(),
      getDistinctSubjects(),
      getDistinctOrganizations(),
      getDistinctLevels(),
      getDistinctCourseNumbers(),
    ]);

    const withDataTimestamp = (
    entry: Omit<MetadataRoute.Sitemap[number], "lastModified">
  ): MetadataRoute.Sitemap[number] =>
    lastModified ? { ...entry, lastModified } : entry;

    const urls = staticRoutes.map(withDataTimestamp);

    subjects
    .filter(Boolean)
    .forEach((value) => {
      urls.push(
        withDataTimestamp({
          url: `${siteUrl}/subjects/${slugify(value)}`,
          changeFrequency: "weekly",
          priority: 0.8,
        })
      );
    });

    organizations
    .filter(Boolean)
    .forEach((value) => {
      urls.push(
        withDataTimestamp({
          url: `${siteUrl}/organizations/${slugify(value)}`,
          changeFrequency: "weekly",
          priority: 0.8,
        })
      );
    });

    levels
    .filter(Boolean)
    .forEach((value) => {
      urls.push(
        withDataTimestamp({
          url: `${siteUrl}/levels/${slugify(value)}`,
          changeFrequency: "weekly",
          priority: 0.7,
        })
      );
    });

    courses
    .filter(Boolean)
    .forEach((value) => {
      urls.push(
        withDataTimestamp({
          url: `${siteUrl}/courses/${slugify(value)}`,
          changeFrequency: "weekly",
          priority: 0.9,
        })
      );
    });

    return Array.from(new Map(urls.map((entry) => [entry.url, entry])).values());
  } catch (error) {
    console.error("Failed to load transfer sitemap data:", error);
    return staticRoutes;
  }
}
