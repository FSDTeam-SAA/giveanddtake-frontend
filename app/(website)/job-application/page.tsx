"use client";

import { useSearchParams } from "next/navigation";
import JobApplicationPage from "./components/job-application-page";

export default function Page() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("id");
  return (
    <div>
        <JobApplicationPage jobId={jobId as string} />
    </div>
  );
}
