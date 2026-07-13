"use client";

import { useEffect } from "react";
import { Honeybadger } from "@honeybadger-io/react";
import "../../honeybadger.browser.config.js";

/**
 * Global App Router error UI (replaces the root layout when active).
 * Reports to Honeybadger when NEXT_PUBLIC_HONEYBADGER_API_KEY is configured.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Honeybadger.notify(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          id="main-content"
          className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10"
        >
          <div role="alert" className="w-full text-center">
            <h2 className="mb-2 text-2xl font-semibold">Something went wrong</h2>
            <p className="mb-8 text-sm">
              We encountered an unexpected error. Please try again.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-md border px-6 py-2 text-sm font-semibold"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
