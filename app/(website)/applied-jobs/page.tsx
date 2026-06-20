import { redirect } from "next/navigation";

// Applied Jobs has been consolidated into the account Job History page, which
// presents the same applications (same /applied-jobs/user/:id data) in a cleaner
// table. Redirect any old links/bookmarks/notifications here.
export default function AppliedJobsPage() {
  redirect("/account/job-history");
}
