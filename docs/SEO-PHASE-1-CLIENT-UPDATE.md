Hello,

I have reviewed the Google Search Console reports and completed the lower-risk technical improvements in the website frontend. While broader SEO optimisation and ongoing search performance work fall outside the current development scope and are handled by our dedicated SEO team, I have addressed the frontend issues that we could safely improve within this phase.

The changes have been tested in both local and server production builds and deployed to the live website on 13 October 2026. Post-deployment checks of the public website passed, and the previous release has been retained for rollback.

What has been completed and why

1. Correct canonical URLs for public pages

   The main layout previously supplied the homepage as the default canonical URL, which was inherited by several different pages. This could tell Google that those pages should be treated as versions of the homepage. I removed that shared canonical and added page-specific canonical URLs for the main public pages. Blog metadata now identifies the article's current slug, including when the article is opened through an ID or the older blog-detail route. This gives Google clearer signals about each page's preferred URL without changing the website's navigation or introducing redirects.

2. Page-specific titles, descriptions and sharing information

   The main public pages now have distinct titles and descriptions, along with matching social sharing metadata. Blog articles now receive server-generated titles, descriptions and article sharing information using the existing public API. The browser title component also preserves these titles when visitors navigate between pages. This helps search engines and sharing services identify the relevant page instead of repeatedly seeing generic website information.

3. Clear indexing instructions for internal pages

   Selected account, dashboard, messaging, application, payment, verification and other utility routes now explicitly declare `noindex`. These pages support the product but generally do not need to appear in public search results. I also adjusted robots.txt so crawlers can read those instructions. Authentication and access permissions have not been changed; indexing instructions do not replace access controls.

4. Removed obsolete search structured data

   I removed the old site-search action from the website's structured data, including its placeholder search URL. The website's search functionality remains in place. This removes an unnecessary source of crawler confusion, although Google may retain previously discovered URLs in Search Console until it revisits them.

5. Corrected blog navigation markup

   The article's “Blogs” breadcrumb now returns to the blog listing, and the blog cards no longer contain nested links. The cards remain clickable. These changes improve link structure and navigation without redesigning the pages.

6. More accurate sitemap modification dates

   The sitemap no longer marks pages as newly updated simply because it was generated again. It uses existing content update or creation dates where available and omits modification dates where no reliable date is available. This gives crawlers more accurate information about content changes.

7. Conservative handling of missing article metadata

   When the existing API explicitly confirms that an article does not exist, the frontend now marks that article response as `noindex`. Temporary API failures use fallback metadata instead, so an outage does not incorrectly mark a valid article as deleted. Returning a genuine HTTP 404 for missing articles remains a separate task.

What was tested

- The local and server production builds completed successfully. The server's existing dependencies and production configuration were preserved.
- All 27 automated tests passed locally and on the server, including checks for the new metadata, canonical URLs, indexing directives, article fallback behaviour and sitemap dates.
- All 29 URLs in the current API-backed sitemap were checked for the expected canonical URLs and metadata, both in the server preview and on the live public website after deployment.
- Thirty sampled internal URLs were checked for their `noindex` instructions in the server preview and on the live website.
- Browser checks covered the homepage, blog listing, opening an article, article titles during navigation, the corrected breadcrumb, job listing and opening job details.

All implementation changes are confined to the website frontend. No backend code, database schema, API contract or mobile application code was changed. The new article metadata uses the existing read-only public endpoint. Authenticated account actions, transactions and mobile app flows were not part of this verification.

What remains

- Old or changed blog URLs: some reported article slugs no longer resolve through the API. These need a decision about restoring the content, redirecting to a confirmed replacement, or leaving them removed. Reliable redirect handling may require slug history and coordination with the backend and mobile application.
- Article rendering and missing-page status: the article body still uses the existing client-side rendering approach. Server-rendering the content and returning genuine HTTP 404 responses for missing articles need a separately tested implementation.
- Content discovery and sitemap completeness: blog pagination, the API's job pagination limit, and sitemap behaviour during API failures remain for a further phase.
- SEO review: the dedicated SEO team should assess content quality, duplicate-content decisions, keywords, internal linking and search performance. Technical corrections make the signals clearer, but they do not guarantee that Google will index every public URL.

The “19 excluded URLs” report should also be interpreted by URL type. Internal utility pages, duplicate alternatives, font files and favicon files do not all need to become indexed pages. The correct objective is for useful, unique public pages to be eligible for indexing, rather than reducing every exclusion count to zero. The unusual `/$` and `/&` URLs can continue returning 404 if they are not real pages; any links generating them should be removed if found.

The live website checks are complete. The next step is for the SEO team to review the sitemap and affected URLs in Search Console, then request indexing or validate fixes where appropriate. Google will need to recrawl and reassess the affected URLs before the reports reflect the changes. Search Console actions have not been performed as part of this deployment.

Regards,
Fahim
