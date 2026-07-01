const localFallback = "http://localhost:3000";

function withProtocol(url: string): string {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return normalized.replace(/\/$/, "");
}

export function getBaseUrl(): string {
  const explicitBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicitBase) return withProtocol(explicitBase);

  const explicitSite = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicitSite) return withProtocol(explicitSite);

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionHost) return withProtocol(productionHost);

  const vercelHost = process.env.VERCEL_URL;
  if (vercelHost) return withProtocol(vercelHost);

  return localFallback;
}

export const siteUrl = getBaseUrl();

export const lastUpdated = process.env.NEXT_PUBLIC_LAST_UPDATED ?? "";

export function formatLastUpdated(dateStr: string): string {
  const date = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function getLastModifiedDate(): Date {
  if (!lastUpdated) return new Date();
  const date = new Date(lastUpdated.length === 10 ? `${lastUpdated}T00:00:00` : lastUpdated);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
