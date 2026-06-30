"use client";

import React, { useState } from "react";
import coursesDataRaw from "../data/courses.json";

// Define the types based on data.json
type Course = {
  title: string | null;
  pid: string | null;
  eligibilityTimeframe: string | null;
  groupFilter2Name: string | null;
  academicLevel: string | null;
  coursePID: string | null;
  courseName: string | null;
};

type CoursesByNumber = {
  [courseNumber: string]: Course[];
};

type CoursesData = {
  [subjectPrefix: string]: CoursesByNumber;
};

// Use unknown first to satisfy TypeScript's strict type checking
const coursesData = coursesDataRaw as unknown as CoursesData;

export default function Home() {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        SNHU Transfer List - Sorted by subject and course - Last update: 20230713
      </h1>

      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
        <table className="min-w-full border-collapse bg-white">
          <thead className="bg-[#0077b6] text-white">
            <tr>
              <th className="text-left p-3 border border-gray-300 font-semibold">Course Number</th>
              <th className="text-left p-3 border border-gray-300 font-semibold">Organization</th>
              <th className="text-left p-3 border border-gray-300 font-semibold">Class Title</th>
              <th className="text-left p-3 border border-gray-300 font-semibold">Eligibility Timeframe</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(coursesData).map(([subjectPrefix, prefixCoursesDict]) => (
              Object.entries(prefixCoursesDict).map(([courseNumber, coursesList]) => {
                const rowId = `${subjectPrefix}-${courseNumber}`;
                const isExpanded = expandedRows[rowId];

                return (
                  <React.Fragment key={rowId}>
                    {/* Course Header Row */}
                    <tr
                      className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors"
                      onClick={() => toggleRow(rowId)}
                    >
                      <td colSpan={4} className="p-3 border border-gray-300 font-bold text-gray-800">
                        <div className="flex items-center">
                          <span className="mr-2 text-xs opacity-70 w-4 inline-block text-center">{isExpanded ? '▼' : '▶'}</span>
                          {courseNumber}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details Rows */}
                    {isExpanded &&
                      coursesList.map((course, idx) => (
                        <tr key={`${rowId}-${idx}`} className="hover:bg-gray-50 border-b border-gray-200 last:border-b-0 transition-colors">
                          <td className="p-3 border border-gray-300 font-bold">
                            {course.pid ? (
                              <a
                                href={`https://www.snhu.edu/admission/transferring-credits/work-life-experience#/experiences/${course.pid}`}
                                className="text-[#0077b6] hover:text-[#004772] hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {courseNumber}
                              </a>
                            ) : (
                              <span>{courseNumber}</span>
                            )}
                          </td>
                          <td className="p-3 border border-gray-300 text-gray-700">{course.groupFilter2Name || 'N/A'}</td>
                          <td className="p-3 border border-gray-300 text-gray-700">{course.title || 'N/A'}</td>
                          <td className="p-3 border border-gray-300 text-gray-700">{course.eligibilityTimeframe || 'N/A'}</td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-700 border border-gray-200">
        <b>Disclaimer:</b> This is an unofficial compilation. Remember to double-check the official SNHU website for transfer eligibility, and always verify with your advisor!
      </div>
    </div>
  );
}
