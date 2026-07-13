import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { canonicalPath } from "@/lib/slug";
import { siteUrl } from "@/lib/site";
import { getOrganizationDirectoryEntries } from "@/lib/seoQueries";

const title = "SNHU Transfer Providers and Organizations";
const description =
  "Browse organizations and providers with unofficial SNHU transfer credit mappings.";
const canonical = canonicalPath("/organizations", siteUrl);

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical },
  twitter: { card: "summary", title, description },
};

export default async function OrganizationsDirectoryPage() {
  const entries = await getOrganizationDirectoryEntries();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-1 flex-col gap-6 px-4 py-8 pb-28 md:px-8"
      >
        <section className="rounded-lg border border-surface-variant bg-surface-container-low p-5">
          <h1 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-primary md:text-3xl">
            SNHU Transfer Providers and Organizations
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
            Alphabetical list of providers and organizations with listed transfer options.
          </p>
        </section>

        <section className="rounded-lg border border-surface-variant bg-surface-container-low p-5">
          {entries.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No organizations are available yet.</p>
          ) : (
            <ul className="columns-1 gap-x-8 sm:columns-2 md:columns-3">
              {entries.map((entry) => (
                <li key={entry.slug} className="mb-1 break-inside-avoid text-sm">
                  <Link
                    href={`/organizations/${entry.slug}`}
                    className="text-on-surface-variant transition-colors hover:text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {entry.value} ({entry.count})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
