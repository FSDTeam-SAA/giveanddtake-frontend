import type { QueryClient } from "@tanstack/react-query";

/**
 * Query-key roots for every React Query cache that holds a profile's
 * name / avatar / logo / banner — for the current user or anyone else.
 *
 * React Query invalidation matches by prefix, so listing the root key here
 * also invalidates every variant of it. e.g. "recruiter" matches
 * ["recruiter"], ["recruiter", userId] and ["recruiter", userId, token].
 *
 * The backend mirrors each role's photo/name onto the shared User document
 * (User.avatar / User.name) on every profile edit, and the navbar/sidebar read
 * that via GET /user/single (cached under "userData"). So refetching this set
 * after any edit keeps the global identity and the role/public views in sync.
 */
export const PROFILE_QUERY_KEY_ROOTS = [
  "userData", // GET /user/single — own User.name + avatar (navbar, account sidebar, personal info)
  "single-user", // GET /user/single via follow / security-question flows
  "recruiter", // recruiter account (dashboard, EVP editor, public /rp)
  "company", // company profile (EVP company page, public /cmp)
  "company-account", // company account lookup (navbar, EVP parent page)
  "company-jobs", // company jobs list (shows company name/logo on cards)
  "my-resume", // candidate resume (EVP candidate page, public /cp)
] as const;

/**
 * Refetch every surface that displays the current user's profile after they
 * edit their name / image / logo / banner, so the change shows up instantly
 * everywhere — navbar avatar, account sidebar, dashboard, EVP profile and the
 * public profile — without requiring a full page reload.
 *
 * `refetchType: "all"` is required: the global QueryClient is configured with
 * `refetchOnMount: false`, so without it a cached-but-unmounted query would
 * stay stale until the next hard refresh. "all" refetches the active observers
 * immediately and the inactive cached queries in the background.
 */
export function invalidateProfileQueries(queryClient: QueryClient) {
  return Promise.all(
    PROFILE_QUERY_KEY_ROOTS.map((key) =>
      queryClient.invalidateQueries({ queryKey: [key], refetchType: "all" })
    )
  );
}
