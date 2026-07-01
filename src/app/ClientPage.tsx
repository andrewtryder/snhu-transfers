"use client";

import React, { useState, useMemo, KeyboardEvent } from "react";
import { ChevronDownIcon, ChevronRightIcon, SearchIcon, BuildingIcon, BookOpenIcon, GraduationCapIcon } from "lucide-react";

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

type ViewType = "subject" | "organization" | "level";

export default function ClientPage({ initialCoursesData }: { initialCoursesData: CoursesData }) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<ViewType>("subject");

  // Flatten the courses for easier re-grouping
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

  // Group and filter based on active view
  const groupedAndFilteredCourses = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    // 1. Filter
    const filtered = allCourses.filter(course =>
      (course.courseName && course.courseName.toLowerCase().includes(searchLower)) ||
      (course.title && course.title.toLowerCase().includes(searchLower)) ||
      (course.groupFilter2Name && course.groupFilter2Name.toLowerCase().includes(searchLower))
    );

    // 2. Group
    const grouped: Record<string, Course[]> = {};

    filtered.forEach(course => {
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

    // Sort the keys
    return Object.keys(grouped).sort().map(key => ({
      groupName: key,
      coursesList: grouped[key]
    }));
  }, [allCourses, searchTerm, activeView]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">SNHU Transfer List</h1>
          <p className="mt-2 text-slate-500 text-lg">Easily find transfer equivalencies for your academic journey.</p>
        </header>

        {/* Controls: Search and Tabs */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Search */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              aria-label="Search courses"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0077b6] focus:border-[#0077b6] transition-all sm:text-sm"
              placeholder="Search by course, title, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* View Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveView("subject")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeView === "subject" ? "bg-white text-[#0077b6] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <BookOpenIcon className="w-4 h-4" />
              By Subject
            </button>
            <button
              onClick={() => setActiveView("organization")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeView === "organization" ? "bg-white text-[#0077b6] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <BuildingIcon className="w-4 h-4" />
              By Organization
            </button>
            <button
              onClick={() => setActiveView("level")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeView === "level" ? "bg-white text-[#0077b6] shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <GraduationCapIcon className="w-4 h-4" />
              By Level
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Group</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {groupedAndFilteredCourses.length === 0 ? (
                   <tr>
                     <td colSpan={2} className="px-6 py-12 text-center text-slate-500">
                        No courses found matching your search.
                     </td>
                   </tr>
                ) : (
                  groupedAndFilteredCourses.map(({ groupName, coursesList }) => {
                    const rowId = groupName;
                    const isExpanded = expandedRows[rowId];

                    return (
                      <React.Fragment key={rowId}>
                        {/* Group Header Row */}
                        <tr
                          className="cursor-pointer hover:bg-slate-50 transition-colors group"
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onKeyDown={(e) => handleKeyDown(e, rowId)}
                          onClick={() => toggleRow(rowId)}
                        >
                          <td colSpan={2} className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-slate-900 font-semibold">
                              <span className="mr-3 text-slate-400 group-hover:text-[#0077b6] transition-colors">
                                {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                              </span>
                              <span className="text-base">{groupName}</span>
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                {coursesList.length} {coursesList.length === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details Rows */}
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={2} className="p-0 border-b-0">
                               <div className="px-6 py-4 md:px-14">
                                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                  <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50">
                                      <tr>
                                        {activeView !== "subject" && <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Course</th>}
                                        {activeView !== "organization" && <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Organization</th>}
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Title</th>
                                        {activeView !== "level" && <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden sm:table-cell">Level</th>}
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden md:table-cell">Timeframe</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {coursesList.map((course, idx) => (
                                        <tr key={`${rowId}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                          {activeView !== "subject" && (
                                            <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                               {course.pid ? (
                                                <a
                                                  href={`https://www.snhu.edu/admission/transferring-credits/work-life-experience#/experiences/${course.pid}`}
                                                  className="text-[#0077b6] hover:underline"
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
                                            <td className="px-4 py-3 text-sm text-slate-600">{course.groupFilter2Name || '-'}</td>
                                          )}
                                          <td className="px-4 py-3 text-sm text-slate-900">
                                            {activeView === "subject" ? (
                                              course.pid ? (
                                                <a
                                                  href={`https://www.snhu.edu/admission/transferring-credits/work-life-experience#/experiences/${course.pid}`}
                                                  className="text-[#0077b6] hover:underline font-medium"
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  {course.title || '-'}
                                                </a>
                                              ) : (
                                                <span className="font-medium">{course.title || '-'}</span>
                                              )
                                            ) : (
                                              course.title || '-'
                                            )}
                                          </td>
                                          {activeView !== "level" && (
                                            <td className="px-4 py-3 text-sm text-slate-600 hidden sm:table-cell">
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                                {course.academicLevel || '-'}
                                              </span>
                                            </td>
                                          )}
                                          <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{course.eligibilityTimeframe || '-'}</td>
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

        {/* Footer Disclaimer */}
        <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border border-slate-200 text-sm text-slate-500 flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">
             <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <p>
            <strong className="font-semibold text-slate-700">Disclaimer:</strong> This is an unofficial compilation. Remember to double-check the official SNHU website for transfer eligibility, and always verify with your advisor!
          </p>
        </div>
      </div>
    </div>
  );
}
