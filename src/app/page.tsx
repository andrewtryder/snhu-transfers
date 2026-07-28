import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import ClientPage from "./ClientPage";
import { getAllTransferRows, buildFacetSummaries } from "@/lib/seoQueries";

type Course = {
  title: string | null;
  pid: string | null;
  eligibilityTimeframe: string | null;
  groupFilter2Name: string | null;
  academicLevel: string | null;
  coursePID: string | null;
  courseName: string | null;
};

type CoursesByGroup = {
  [groupName: string]: Course[];
};

type CoursesData = {
  [subjectPrefix: string]: CoursesByGroup;
};

export const metadata: Metadata = {
  title: {
    absolute: "SNHU Transfer Equivalency List | Search Accepted Transfer Credits",
  },
  description:
    "Search unofficial SNHU transfer equivalencies and accepted transfer credits by course number, provider, subject, and level. Compare sources like Sophia Learning, Study.com, AP Exams, and more.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SNHU Transfer Equivalency List | Search Accepted Transfer Credits",
    description:
      "Search unofficial SNHU transfer equivalencies and accepted transfer credits by course number, provider, subject, and level. Compare sources like Sophia Learning, Study.com, AP Exams, and more.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "SNHU Transfer Equivalency List | Search Accepted Transfer Credits",
    description:
      "Search unofficial SNHU transfer equivalencies and accepted transfer credits by course number, provider, subject, and level. Compare sources like Sophia Learning, Study.com, AP Exams, and more.",
  },
};

function toCoursesData(rows: Awaited<ReturnType<typeof getAllTransferRows>>): CoursesData {
  const data: CoursesData = {};

  for (const row of rows) {
    const subjectPrefix = row.subjectPrefix || "UNKNOWN";
    const courseNumber = row.courseNumber || "UNKNOWN";

    if (!data[subjectPrefix]) {
      data[subjectPrefix] = {};
    }
    if (!data[subjectPrefix][courseNumber]) {
      data[subjectPrefix][courseNumber] = [];
    }

    data[subjectPrefix][courseNumber].push({
      title: row.title,
      pid: row.pid,
      eligibilityTimeframe: row.eligibilityTimeframe,
      groupFilter2Name: row.groupFilter2Name,
      academicLevel: row.academicLevel,
      coursePID: row.coursePID,
      courseName: row.courseNumber,
    });
  }

  return data;
}

export async function getHomepagePayload() {
  try {
    // Load transfer rows exactly once. Facets are derived from the same rows
    // without a second full-table database round-trip.
    const rows = await getAllTransferRows();
    const facets = buildFacetSummaries(rows, 20);
    return { rows, facets, dataUnavailable: false };
  } catch (error) {
    console.error("Failed to fetch homepage transfer data:", error);
    return {
      rows: [],
      facets: buildFacetSummaries([], 20),
      dataUnavailable: true,
    };
  }
}

export default async function Page() {
  await connection();
  const { rows, facets, dataUnavailable } = await getHomepagePayload();

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SNHU Transfers",
    description:
      "Unofficial SNHU transfer equivalency search tool for accepted transfer credits by course, provider, subject, and academic level.",
    url: "/",
    publisher: {
      "@type": "Organization",
      name: "SNHU Transfers",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }} />
      {dataUnavailable ? (
        <p className="mx-auto mt-4 w-full max-w-[var(--spacing-container-max)] px-4 text-sm text-on-surface-variant md:px-8">
          Transfer data is temporarily unavailable. Please try again shortly.
        </p>
      ) : null}
      <Suspense fallback={null}>
        <ClientPage initialCoursesData={toCoursesData(rows)} seoFacets={facets} />
      </Suspense>
    </>
  );
}
