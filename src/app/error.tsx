"use client";

import { useEffect } from "react";
import { Honeybadger } from "@honeybadger-io/react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import "../../honeybadger.browser.config.js";

export default function Error({
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
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-1 items-center justify-center px-4 py-10 md:px-8 pb-28"
      >
        <div
          role="alert"
          className="w-full max-w-md rounded-lg border border-error-container bg-error-container p-8 text-center"
        >
          <h2 className="mb-2 font-[family-name:var(--font-headline)] text-2xl font-semibold text-on-error-container">
            Something went wrong
          </h2>
          <p className="mb-8 text-sm text-on-error-container">
            We encountered an error while trying to load the transfer list. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-secondary-container px-6 py-2 text-sm font-semibold text-on-secondary-container transition-colors hover:bg-secondary"
          >
            Try again
          </button>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
