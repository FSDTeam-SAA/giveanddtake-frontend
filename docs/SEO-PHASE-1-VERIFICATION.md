# Frontend technical SEO phase: implementation and verification

Date: 13 October 2026. Status: deployed to https://evpitch.com at approximately 10:11 AM Bangladesh time.

## Scope

Frontend-only changes: shared canonical correction; metadata for 11 public routes; article metadata for current and legacy article routes; noindex metadata on 26 internal route groups; preservation of server titles; obsolete SearchAction removal; blog link/breadcrumb markup; truthful sitemap dates. The account layout's original client component was moved into a same-directory file and wrapped by a server layout to supply metadata.

No backend, API contract, database, mobile application, dependency or environment-file changes were made. The frontend was deployed as a separate release using the server's existing dependencies and production configuration. Existing article bodies, authentication, payment flows and API pagination were retained.

## Verification performed

- `node --test test/job-query.test.cjs test/job-metadata.test.cjs test/job-availability.test.cjs test/seo.test.cjs`: 27 passed, 0 failed. The new suite covers canonical/sharing metadata, internal noindex policy, title preservation, article ID-to-slug metadata, confirmed API 404 versus temporary failures, malformed response/timeout fallbacks, metadata sanitisation and sitemap dates.
- `npm run build`: passed using the existing local configuration, and passed with the existing public production API supplied through the build process environment. The second build supplied representative real content for local verification. Environment files were not changed.
- Independent `tsc --noEmit --incremental false`: the before/after diagnostics were identical. The repository already has TypeScript errors, and its existing Next configuration skips type and lint checks during builds. A successful production build is therefore not a clean repository-wide type/lint result.
- Local production HTTP inspection: all 29 current API-backed sitemap URLs had the expected canonical and page-specific metadata. Next normalises the root canonical to the site origin without a trailing slash; this is equivalent to the sitemap's root URL.
- Thirty sampled internal URLs, including account children and search query variants, emitted generic and Google-specific noindex directives. These checks confirm metadata, not authenticated account functionality.
- Article ID and legacy blog-detail aliases identified the current article slug as canonical. A confirmed missing article emitted noindex while retaining the existing HTTP 200 response; a genuine HTTP 404 remains deferred.
- robots.txt retained the API restriction and allowed crawlers to read the internal pages' noindex metadata. This does not grant access to protected data or alter authentication.
- Browser checks: homepage rendering; Blogs navigation; article opening; article title preservation; breadcrumb return to Blogs; no nested anchors on blog cards; Jobs navigation; job-detail opening and rendering.
- Reviewed the git diff and checked whitespace with the repository's existing CRLF style allowed.

## Limits and observed existing behaviour

- No live Search Console account changes were made.
- No payment, account mutation, application submission, upload, authenticated dashboard or mobile end-to-end tests were performed. Public API access was read-only.
- No mobile viewport/device regression check was performed.
- Existing React useLayoutEffect warnings appeared in the automated test environment.
- Local browser logs included failed protected-route prefetch requests for `/elevator-video-pitch` in the local authentication/environment setup. This check did not establish authenticated flow correctness.
- The article metadata fetch adds a bounded read to the existing endpoint, with a five-second timeout and five-minute Next cache revalidation. Network or temporary server failures fall back to generic route metadata instead of preventing rendering or adding noindex.
- Blog body rendering, proper missing-article HTTP status, old-slug redirects/history, listing pagination, sitemap API pagination and outage resilience remain deferred.

## Deployment record

- Client server: `72.61.144.61`. SSH used the existing recovery key; password authentication was not needed.
- New release: `/var/www/releases/client-seo-20261013T040557Z`.
- Previous release/rollback copy: `/var/www/backups/client-pre-seo-20261013T041110Z`.
- Stable application path: `/var/www/client`, now a symlink to the new release. The PM2 process still uses the stable path.
- Applied only the 54 changed/new frontend files after confirming the server originals matched the local baseline. Existing server dependency updates, including Next 15.5.25, were preserved instead of replaced with the local dependency manifest.
- All 27 automated tests passed on the server, and the server production build succeeded.
- Separate preview on loopback port 3101 passed 29 public sitemap URL checks, 30 internal URL checks, robots checks and the missing-article noindex check before cutover.
- Restarted only the PM2 `client` process and saved its process list. Public HTTPS verification passed the same 29 public and 30 internal URL checks immediately after cutover.
- Server-side evidence: `seo-tests.log`, `seo-build.log`, `seo-preview-verification.json` and `seo-live-verification.json` in the release directory; `/var/www/releases/seo-deployment-result.json` records the rollout and backup paths.
- Admin/API processes on `82.29.190.125` were inspected without deployment or restart. Their public endpoints were checked separately.

## Follow-up

1. Have the SEO team review the actual affected URLs in Search Console, including Google-selected canonicals and rendered content, then request indexing or validate relevant fixes.
2. Monitor recrawl results. Expected utility, duplicate and asset exclusions should not be treated as failures.
3. Scope the deferred article status/rendering, old-slug handling and pagination work separately.

References: [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing), and [Google's retirement of the sitelinks search box](https://developers.google.com/search/blog/2024/10/sitelinks-search-box).
