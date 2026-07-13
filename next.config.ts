import type { NextConfig } from "next";
import { setupHoneybadger } from "@honeybadger-io/nextjs";

const nextConfig: NextConfig = {
  // Next.js 16 defaults to Turbopack. An empty turbopack config acknowledges
  // that @honeybadger-io/nextjs still injects a webpack() helper (used only
  // when building with --webpack). App Router monitoring does not depend on it.
  turbopack: {},
};

/**
 * Official Honeybadger Next.js wrapper.
 * Source map upload is intentionally disabled.
 * Under Turbopack, webpack entry injection does not run; coverage comes from
 * instrumentation, App Router error UI, and manual server notifies.
 */
export default setupHoneybadger(nextConfig, {
  disableSourceMapUpload: true,
  silent: true,
});
