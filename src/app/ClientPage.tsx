"use client";

import React, { useState, useMemo, KeyboardEvent } from "react";
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
};

type CoursesByGroup = {
  [groupName: string]: Course[];
};

type CoursesData = {
  [subjectPrefix: string]: CoursesByGroup;
};

export default function ClientPage({ initialCoursesData }: { initialCoursesData: CoursesData }) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<ViewType>("subject");

  const allCourses = useMemo(() => {
    const courses: Course[] = [];
    for (const prefix of Object.values(initialCoursesData)) {
      for (const courseList of Object.values(prefix)) {
        courses.push(...courseList);
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
    const searchLower = searchTerm.toLowerCase();

    const filtered = allCourses.filter(
      (course) =>
        (course.courseName && course.courseName.toLowerCase().includes(searchLower)) ||
        (course.title && course.title.toLowerCase().includes(searchLower)) ||
        (course.groupFilter2Name && course.groupFilter2Name.toLowerCase().includes(searchLower))
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
  }, [allCourses, searchTerm, activeView]);

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
        className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-1 flex-col px-4 py-6 md:px-8 md:py-8 pb-28"
      >
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
