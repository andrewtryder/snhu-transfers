import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <header className="mb-10 text-center sm:text-left">
          <div className="h-10 bg-slate-200 rounded w-64 mb-4 mx-auto sm:mx-0"></div>
          <div className="h-5 bg-slate-200 rounded w-96 mx-auto sm:mx-0"></div>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-96 h-10 bg-slate-200 rounded"></div>
          <div className="w-full md:w-72 h-10 bg-slate-200 rounded"></div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between border-b border-slate-100 pb-4">
                <div className="h-6 bg-slate-200 rounded w-32"></div>
                <div className="h-6 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
