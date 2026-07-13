const productionSiteUrl = "https://snhu-transfers.vercel.app";

function withProtocol(url: string): string {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return normalized.replace(/\/$/, "");
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? withProtocol(process.env.NEXT_PUBLIC_SITE_URL)
  : productionSiteUrl;

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
