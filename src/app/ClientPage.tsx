"use client";

import React, { useState, useMemo, KeyboardEvent, useDeferredValue } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { AppHeader, type ViewType } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

type Course = {
  title: string | null;
  pid: string | null;
  eligibilityTimeframe: string | null;
  groupFilter2Name: string | null;
  academicLevel: string | null;
  coursePID: string | null;
  courseName: string | null;
  searchString?: string;
};

type CoursesByGroup = {
  [groupName: string]: Course[];
};

type CoursesData = {
  [subjectPrefix: string]: CoursesByGroup;
};

type FacetSummary = {
  value: string;
  count: number;
  slug: string;
};

type SeoFacets = {
  subjects: FacetSummary[];
  organizations: FacetSummary[];
  levels: FacetSummary[];
  courses: FacetSummary[];
};

export default function ClientPage({
  initialCoursesData,
  seoFacets,
}: {
  initialCoursesData: CoursesData;
  seoFacets: SeoFacets;
}) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [activeView, setActiveView] = useState<ViewType>("subject");

  const allCourses = useMemo(() => {
    const courses: Course[] = [];
    for (const prefix of Object.values(initialCoursesData)) {
      for (const courseList of Object.values(prefix)) {
        for (const course of courseList) {
          courses.push({
            ...course,
            searchString: `${course.courseName || ""} ${course.title || ""} ${course.groupFilter2Name || ""}`.toLowerCase(),
          });
        }
      }
    }
    return courses;
  }, [initialCoursesData]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleRow(id);
    }
  };

  const groupedAndFilteredCourses = useMemo(() => {
    const searchLower = deferredSearchTerm.toLowerCase();

    const filtered = allCourses.filter(
      (course) => course.searchString?.includes(searchLower)
    );

    const grouped: Record<string, Course[]> = {};

    filtered.forEach((course) => {
      let key = "";
      if (activeView === "subject") {
        key = course.courseName || "Unknown Subject";
      } else if (activeView === "organization") {
        key = course.groupFilter2Name || "Unknown Organization";
      } else if (activeView === "level") {
        key = course.academicLevel || "Unknown Level";
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(course);
    });

    return Object.keys(grouped)
      .sort()
      .map((key) => ({
        groupName: key,
        coursesList: grouped[key],
      }));
  }, [allCourses, deferredSearchTerm, activeView]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        showControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-1 flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:py-8"
      >
        <section className="rounded-lg border border-surface-variant bg-surface-container-low p-5">
          <h1 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-primary md:text-3xl">
            SNHU Transfer Equivalency List
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
            Search unofficial SNHU transfer equivalencies by course, provider, subject, and academic level.
            Browse crawlable landing pages below for popular topics, then use the interactive table to filter
            details.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h2 className="text-sm font-semibold text-on-surface">Top Subjects</h2>
              <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                {seoFacets.subjects.slice(0, 8).map((item) => (
                  <li key={`subject-${item.slug}`}>
                    <Link href={`/subjects/${item.slug}`} className="hover:text-primary hover:underline">
                      {item.value} ({item.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-on-surface">Top Organizations</h2>
              <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                {seoFacets.organizations.slice(0, 8).map((item) => (
                  <li key={`org-${item.slug}`}>
                    <Link href={`/organizations/${item.slug}`} className="hover:text-primary hover:underline">
                      {item.value} ({item.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-on-surface">Academic Levels</h2>
              <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                {seoFacets.levels.slice(0, 8).map((item) => (
                  <li key={`level-${item.slug}`}>
                    <Link href={`/levels/${item.slug}`} className="hover:text-primary hover:underline">
                      {item.value} ({item.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-on-surface">Popular Courses</h2>
              <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                {seoFacets.courses.slice(0, 8).map((item) => (
                  <li key={`course-${item.slug}`}>
                    <Link href={`/courses/${item.slug}`} className="hover:text-primary hover:underline">
                      {item.value} ({item.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-5 text-xs text-on-surface-variant">
            <strong className="text-on-surface">Disclaimer:</strong> This is an unofficial compilation.
            Remember to double-check the official SNHU website for transfer eligibility, and always verify with your advisor.
          </p>
        </section>

        <div className="overflow-hidden rounded-lg border border-surface-variant bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-variant">
              <thead className="bg-surface-container-low">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  >
                    Group
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant bg-surface-container-lowest">
                {groupedAndFilteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-on-surface-variant">
                      No courses found matching your search.
                    </td>
                  </tr>
                ) : (
                  groupedAndFilteredCourses.map(({ groupName, coursesList }) => {
                    const rowId = groupName;
                    const isExpanded = expandedRows[rowId];

                    return (
                      <React.Fragment key={rowId}>
                        <tr
                          className="group cursor-pointer transition-colors hover:bg-surface-container-low"
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onKeyDown={(e) => handleKeyDown(e, rowId)}
                          onClick={() => toggleRow(rowId)}
                        >
                          <td colSpan={2} className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center font-semibold text-on-surface">
                              <span className="mr-3 text-outline transition-colors group-hover:text-primary">
                                {isExpanded ? (
                                  <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                )}
                              </span>
                              <span className="text-base">{groupName}</span>
                              <span className="ml-3 inline-flex items-center rounded-full border border-surface-variant bg-surface-container-low px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                                {coursesList.length} {coursesList.length === 1 ? "item" : "items"}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-surface-container-low/60">
                            <td colSpan={2} className="border-b-0 p-0">
                              <div className="px-6 py-4 md:px-14">
                                <div className="overflow-hidden rounded-lg border border-surface-variant bg-surface-container-lowest shadow-sm">
                                  <table className="min-w-full divide-y divide-surface-variant">
                                    <thead className="bg-surface-container-low">
                                      <tr>
                                        {activeView !== "subject" && (
                                          <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant">
                                            Course
                                          </th>
                                        )}
                                        {activeView !== "organization" && (
                                          <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant">
                                            Organization
                                          </th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant">
                                          Title
                                        </th>
                                        {activeView !== "level" && (
                                          <th className="hidden px-4 py-3 text-left text-xs font-medium text-on-surface-variant sm:table-cell">
                                            Level
                                          </th>
                                        )}
                                        <th className="hidden px-4 py-3 text-left text-xs font-medium text-on-surface-variant md:table-cell">
                                          Timeframe
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-variant">
                                      {coursesList.map((course, idx) => (
                                        <tr
                                          key={`${rowId}-${idx}`}
                                          className="transition-colors hover:bg-surface-container-low"
                                        >
                                          {activeView !== "subject" && (
                                            <td className="px-4 py-3 text-sm font-medium text-on-surface">
                                              {course.pid ? (
                                                <a
                                                  href={`https://www.snhu.edu/admission/transferring-credits/work-life-experience#/experiences/${course.pid}`}
                                                  className="text-secondary transition-colors hover:text-primary hover:underline"
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  {course.courseName}
                                                </a>
                                              ) : (
                                                course.courseName
                                              )}
                                            </td>
                                          )}
                                          {activeView !== "organization" && (
                                            <td className="px-4 py-3 text-sm text-on-surface-variant">
                                              {course.groupFilter2Name || "-"}
                                            </td>
                                          )}
                                          <td className="px-4 py-3 text-sm text-on-surface">
                                            {activeView === "subject" ? (
                                              course.pid ? (
                                                <a
                                                  href={`https://www.snhu.edu/admission/transferring-credits/work-life-experience#/experiences/${course.pid}`}
                                                  className="font-medium text-secondary transition-colors hover:text-primary hover:underline"
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  {course.title || "-"}
                                                </a>
                                              ) : (
                                                <span className="font-medium">{course.title || "-"}</span>
                                              )
                                            ) : (
                                              course.title || "-"
                                            )}
                                          </td>
                                          {activeView !== "level" && (
                                            <td className="hidden px-4 py-3 text-sm text-on-surface-variant sm:table-cell">
                                              <span className="inline-flex items-center rounded-full border border-surface-variant bg-surface-container-low px-2 py-0.5 text-xs font-medium text-on-surface">
                                                {course.academicLevel || "-"}
                                              </span>
                                            </td>
                                          )}
                                          <td className="hidden px-4 py-3 text-sm text-on-surface-variant md:table-cell">
                                            {course.eligibilityTimeframe || "-"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
