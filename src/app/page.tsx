import type { Metadata } from "next";
import { Suspense } from "react";
import ClientPage from "./ClientPage";
import { getAllTransferRows, getFacetSummaries } from "@/lib/seoQueries";

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

async function getHomepagePayload() {
  try {
    const rows = await getAllTransferRows();
    const facets = await getFacetSummaries(20);
    return { rows, facets };
  } catch (error) {
    console.error("Failed to fetch homepage transfer data:", error);
    throw error;
  }
}

export default async function Page() {
  const { rows, facets } = await getHomepagePayload();

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
      <Suspense fallback={null}>
        <ClientPage initialCoursesData={toCoursesData(rows)} seoFacets={facets} />
      </Suspense>
    </>
  );
}
