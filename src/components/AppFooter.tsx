"use client";

import { useEffect, useState } from "react";
import { formatLastUpdated, lastUpdated } from "@/lib/site";
import { SNHUToolsFooterLinks } from "@/components/SNHUToolsFooterLinks";
import { CURRENT_TOOL_ID, GITHUB_REPO_URL } from "@/lib/snhuTools";

const REPO_OWNER = "andrewtryder";
const REPO_NAME = "snhu-transfers";

async function fetchLastPublishedDate(): Promise<string | null> {
  try {
    const releaseResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`
    );

    if (releaseResponse.ok) {
      const releaseData = await releaseResponse.json();
      const publishedAt = typeof releaseData.published_at === "string" ? releaseData.published_at : "";
      if (publishedAt) return publishedAt;
    }

    const repoResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`);
    if (!repoResponse.ok) return null;

    const repoData = await repoResponse.json();
    const pushedAt = typeof repoData.pushed_at === "string" ? repoData.pushed_at : "";
    return pushedAt || null;
  } catch {
    return null;
  }
}

export function AppFooter() {
  const [resolvedLastUpdated, setResolvedLastUpdated] = useState<string>(lastUpdated);

  useEffect(() => {
    if (resolvedLastUpdated) return;

    let isMounted = true;
    fetchLastPublishedDate()
      .then((date) => {
        if (isMounted && date) {
          setResolvedLastUpdated(date);
        }
      })
      .catch(() => null);

    return () => {
      isMounted = false;
    };
  }, [resolvedLastUpdated]);

  return (
    <footer
      aria-label="Footer"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-variant bg-surface-container-low/95 backdrop-blur"
    >
      <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-4 py-4 md:px-8">
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3 md:items-center">
          <p className="text-center text-sm text-on-surface-variant md:text-left">
            <span className="font-bold text-on-surface">Last Updated:</span>{" "}
            {resolvedLastUpdated ? formatLastUpdated(resolvedLastUpdated) : "Unavailable"}
          </p>
          <p className="text-center text-sm text-on-surface-variant">
            <span className="font-bold text-on-surface">Disclaimer:</span> Unofficial SNHU site. Data
            is provided for informational purposes only. Confirm official requirements with SNHU where
            appropriate.
          </p>
          <nav
            aria-label="Footer navigation"
            className="flex flex-col items-center gap-3 md:items-end"
          >
            <div className="flex flex-wrap justify-center gap-4 text-xs font-medium tracking-wide md:justify-end">
              <a
                href="/browse"
                className="text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low rounded-sm"
              >
                Browse
              </a>
              <a
                href="/about"
                className="text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low rounded-sm"
              >
                About
              </a>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface-variant transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-low rounded-sm"
              >
                Source Code
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
            <SNHUToolsFooterLinks currentToolId={CURRENT_TOOL_ID} />
          </nav>
        </div>
      </div>
    </footer>
  );
}
