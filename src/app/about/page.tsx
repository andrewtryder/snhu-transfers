import type { Metadata } from "next";
import { ArrowUpRight, Info } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about SNHU Transfers — an unofficial site built by an SNHU graduate to help students research transfer equivalencies.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About | SNHU Transfers",
    description:
      "Learn about SNHU Transfers — an unofficial site built by an SNHU graduate to help students research transfer equivalencies.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader currentPage="about" />

      <main
        id="main-content"
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 md:px-8 md:py-16 pb-52 md:pb-32"
      >
        <article aria-labelledby="about-heading">
          <header className="mb-10">
            <h1
              id="about-heading"
              className="font-[family-name:var(--font-headline)] text-3xl font-bold text-primary md:text-4xl"
            >
              About This Tool
            </h1>
          </header>

          <section aria-label="Background" className="space-y-5 text-base leading-relaxed text-on-surface-variant">
            <p>
              I built this site as a proud SNHU graduate who knows how important transfer credits can be,
              especially when you are trying to save time, reduce cost, and make the most of every term.
            </p>
            <p>
              During my time at Southern New Hampshire University, I transferred in several credits and often
              needed a clearer way to understand which certifications, exams, providers, and outside learning
              experiences could apply toward SNHU courses.
            </p>
            <p>
              SNHU Transfers was designed to make that research easier. It helps students browse and search
              transfer equivalencies so they can better understand what may be accepted, which SNHU course it
              may map to, and where to find the official transfer listing for more detail.
            </p>
          </section>

          <section aria-label="Important disclaimer" className="mt-10">
            <div className="flex gap-3 rounded-lg border border-outline-variant bg-surface-container p-5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden="true" />
              <div className="space-y-1.5 text-sm leading-relaxed text-on-surface-variant">
                <p className="font-semibold text-on-surface">Unofficial — For Informational Purposes Only</p>
                <p>
                  This site is unofficial and is intended for informational purposes only. Transfer
                  requirements, evaluations, and catalog rules can change. Always confirm your transfer plan
                  with SNHU for official guidance.
                </p>
              </div>
            </div>
          </section>

          <section aria-label="Related tools" className="mt-8">
            <h2 className="mb-4 font-[family-name:var(--font-headline)] text-lg font-semibold text-on-surface">
              More Tools for SNHU Students
            </h2>
            <a
              href="https://snhu-courses.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-4 rounded-lg border border-surface-variant bg-surface-container-low p-5 transition-colors hover:border-primary hover:bg-surface-container"
            >
              <div className="min-w-0">
                <p className="font-semibold text-primary group-hover:underline">SNHU Courses</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Explore SNHU course prerequisites and visualize dependency paths.
                </p>
              </div>
              <ArrowUpRight
                className="mt-0.5 h-5 w-5 shrink-0 text-outline transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            </a>
          </section>
        </article>
      </main>

      <AppFooter />
    </div>
  );
}
