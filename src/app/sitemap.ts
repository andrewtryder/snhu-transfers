import { MetadataRoute } from "next";
import { slugify } from "@/lib/slug";
import { getLastModifiedDate, siteUrl } from "@/lib/site";
import {
  getDistinctCourseNumbers,
  getDistinctLevels,
  getDistinctOrganizations,
  getDistinctSubjects,
} from "@/lib/seoQueries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = getLastModifiedDate();

  const [subjects, organizations, levels, courses] = await Promise.all([
    getDistinctSubjects(),
    getDistinctOrganizations(),
    getDistinctLevels(),
    getDistinctCourseNumbers(),
  ]);

  const urls: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  subjects
    .filter(Boolean)
    .forEach((value) => {
      urls.push({
        url: `${siteUrl}/subjects/${slugify(value)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

  organizations
    .filter(Boolean)
    .forEach((value) => {
      urls.push({
        url: `${siteUrl}/organizations/${slugify(value)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

  levels
    .filter(Boolean)
    .forEach((value) => {
      urls.push({
        url: `${siteUrl}/levels/${slugify(value)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

  courses
    .filter(Boolean)
    .forEach((value) => {
      urls.push({
        url: `${siteUrl}/courses/${slugify(value)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    });

  const deduped = Array.from(new Map(urls.map((entry) => [entry.url, entry])).values());
  return deduped;
}
