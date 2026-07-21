/**
 * Built-in Content `type` values managed by fixed routes/components rather than
 * the dynamic `/pages/:slug` route. Custom admin-created pages are anything NOT
 * in this set. Used to keep built-ins (and the candidate/recruiter/company
 * "cards", which are not standalone pages) out of the More menu and sitemap.
 */
export const BUILT_IN_CONTENT_TYPES = [
  "about",
  "privacy",
  "candidate",
  "recruiter",
  "company",
  "terms",
] as const;

const builtInSet = new Set<string>(BUILT_IN_CONTENT_TYPES);

/** True when a page is a real, admin-created custom page (safe for /pages/:slug). */
export const isCustomPage = (page: {
  type?: string;
  isSystem?: boolean;
}): boolean => Boolean(page.type && !page.isSystem && !builtInSet.has(page.type));
