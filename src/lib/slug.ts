export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCourseNumber(value: string): string {
  return value.trim().toUpperCase();
}

export function canonicalPath(pathname: string, baseUrl: string): string {
  return new URL(pathname, baseUrl).toString();
}
