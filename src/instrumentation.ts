import type { Instrumentation } from "next";

/**
 * Load Honeybadger server config on Node runtime startup.
 * Needed because Next.js 16 defaults to Turbopack, which does not run the
 * Honeybadger webpack entry injection used by @honeybadger-io/nextjs.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  await import("../honeybadger.server.config.js");
}

export const onRequestError: Instrumentation.onRequestError = async (error) => {
  const { reportServerError } = await import("@/lib/monitoring/honeybadger");
  await reportServerError(error, {
    component: "next-request",
    tags: ["nextjs"],
  });
};
