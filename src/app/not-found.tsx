import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main id="main-content" className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-1 items-center justify-center px-4 py-10 pb-28 md:px-8">
        <div className="w-full max-w-lg rounded-lg border border-surface-variant bg-surface-container-low p-8 text-center">
          <h1 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-primary md:text-3xl">
            Page Not Found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
            We could not find transfer equivalency content for this URL. Try browsing by subject, organization,
            academic level, or course number from the homepage.
          </p>
          <div className="mt-6">
            <Link href="/" className="rounded-md bg-secondary-container px-4 py-2 text-sm font-semibold text-on-secondary-container transition-colors hover:bg-secondary">
              Back to Homepage
            </Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
