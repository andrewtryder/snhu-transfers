import { MetadataRoute } from "next";
import { slugify } from "@/lib/slug";
import { siteUrl } from "@/lib/site";
import {
  getDistinctCourseNumbers,
  getDistinctLevels,
  getDistinctOrganizations,
  getDistinctSubjects,
  getTransferLastModified,
} from "@/lib/seoQueries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = await getTransferLastModified();

  const [subjects, organizations, levels, courses] = await Promise.all([
    getDistinctSubjects(),
    getDistinctOrganizations(),
    getDistinctLevels(),
    getDistinctCourseNumbers(),
  ]);

  const withDataTimestamp = (
    entry: Omit<MetadataRoute.Sitemap[number], "lastModified">
  ): MetadataRoute.Sitemap[number] =>
    lastModified ? { ...entry, lastModified } : entry;

  const urls: MetadataRoute.Sitemap = [
    withDataTimestamp({
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    }),
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    withDataTimestamp({
      url: `${siteUrl}/browse`,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    withDataTimestamp({
      url: `${siteUrl}/courses`,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    withDataTimestamp({
      url: `${siteUrl}/subjects`,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    withDataTimestamp({
      url: `${siteUrl}/organizations`,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    withDataTimestamp({
      url: `${siteUrl}/levels`,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  ];

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

  const deduped = Array.from(new Map(urls.map((entry) => [entry.url, entry])).values());
  return deduped;
}
