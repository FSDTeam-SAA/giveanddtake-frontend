# Profile and text-limit browser regression

For custom skill entry, also run `node test/browser/skills-entry-browser.cjs` with the same external tooling variables. It renders the real create/edit selectors and extracts the actual forms' submit handlers and Zod skills schemas. It covers pending text on Save, suggestions/loading/failure, custom entry, duplicate rules, limits and responsive layout. Persistence is fixture localStorage; no production submissions are made.

Run after `npm run build`, with Playwright (Chrome) and esbuild installed in an external test tooling directory. Set `PLAYWRIGHT_MODULE` and `ESBUILD_MODULE` to their resolved module paths if they are not on Node resolution paths.

`node test/browser/team-feedback-browser.cjs`

The fixture runs on localhost:3031 and uses real website components and CSS. API reads and contact writes are intercepted by its local fixture server; it does not access production accounts or submit production data. Screenshots and logs belong in the workspace artifacts directory. The save/reload/edit check uses fixture local storage, not a backend profile-save integration. Tests cover actual personal/public profile layouts, contact submissions, shared text controls, and the Quill editor.
