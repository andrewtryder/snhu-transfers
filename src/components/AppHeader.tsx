"use client";

import Link from "next/link";
import {
  SearchIcon,
  BuildingIcon,
  BookOpenIcon,
  GraduationCapIcon,
} from "lucide-react";

export type ViewType = "subject" | "organization" | "level";

interface AppHeaderProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  activeView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  showControls?: boolean;
  currentPage?: "home" | "about";
}

const tabBaseClass =
  "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors md:flex-none";
const tabActiveClass = "bg-surface-container-lowest text-primary shadow-sm";
const tabInactiveClass = "text-on-surface-variant hover:text-on-surface";

const searchInputClassName =
  "w-full rounded-full border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary";

function ViewTabs({
  activeView,
  onViewChange,
}: {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}) {
  return (
    <div
      className="flex w-full overflow-x-auto rounded-lg bg-surface-container p-1 lg:w-auto"
      role="tablist"
      aria-label="Group results by"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeView === "subject"}
        onClick={() => onViewChange("subject")}
        className={`${tabBaseClass} ${activeView === "subject" ? tabActiveClass : tabInactiveClass}`}
      >
        <BookOpenIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">By Subject</span>
        <span className="sm:hidden">Subject</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === "organization"}
        onClick={() => onViewChange("organization")}
        className={`${tabBaseClass} ${activeView === "organization" ? tabActiveClass : tabInactiveClass}`}
      >
        <BuildingIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">By Organization</span>
        <span className="sm:hidden">Org</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeView === "level"}
        onClick={() => onViewChange("level")}
        className={`${tabBaseClass} ${activeView === "level" ? tabActiveClass : tabInactiveClass}`}
      >
        <GraduationCapIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">By Level</span>
        <span className="sm:hidden">Level</span>
      </button>
    </div>
  );
}

function ControlledSearchInput({
  searchTerm,
  onSearchChange,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full min-w-0">
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
        aria-hidden="true"
      />
      <input
        type="text"
        aria-label="Search courses"
        className={searchInputClassName}
        placeholder="Search by course, title, or organization..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}

function GlobalSearchForm() {
  return (
    <form action="/" method="get" role="search" className="relative w-full min-w-0">
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        aria-label="Search courses"
        className={searchInputClassName}
        placeholder="Search by course, title, or organization..."
      />
    </form>
  );
}

export function AppHeader({
  searchTerm = "",
  onSearchChange,
  activeView = "subject",
  onViewChange,
  showControls = false,
  currentPage = "home",
}: AppHeaderProps) {
  const hasControls = Boolean(showControls && onSearchChange && onViewChange);

  return (
    <header className="sticky top-0 z-20 border-b border-surface-variant bg-surface">
      <div className="mx-auto grid w-full max-w-[var(--spacing-container-max)] grid-cols-1 gap-3 px-4 py-3 md:px-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex shrink-0 items-baseline gap-2 justify-self-start rounded-lg border border-surface-variant bg-surface-container-low px-3 py-2 no-underline transition-colors hover:border-primary hover:bg-surface-container"
            aria-label="SNHU Transfer Equivalency List home"
          >
            <span className="font-[family-name:var(--font-headline)] text-lg font-bold leading-none text-primary">
              SNHU
            </span>
            <span className="font-[family-name:var(--font-headline)] text-sm font-semibold leading-none tracking-wide text-on-surface">
              Transfer Equivalency List
            </span>
          </Link>

          {currentPage === "about" && (
            <span
              aria-current="page"
              className="hidden text-sm font-semibold tracking-wide text-primary md:inline"
            >
              About
            </span>
          )}
        </div>

        <div className="lg:col-start-2 lg:row-start-1">
          {hasControls ? (
            <ControlledSearchInput searchTerm={searchTerm} onSearchChange={onSearchChange!} />
          ) : (
            <GlobalSearchForm />
          )}
        </div>

        {hasControls && (
          <div className="lg:col-start-3 lg:row-start-1 lg:justify-self-end">
            <ViewTabs activeView={activeView} onViewChange={onViewChange!} />
          </div>
        )}
      </div>
    </header>
  );
}
