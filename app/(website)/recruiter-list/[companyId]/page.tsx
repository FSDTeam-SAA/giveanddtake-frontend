"use client";

import { useParams } from "next/navigation";
import RecruiterListPage from "./_components/recruiterListPage";

function RecruiterListWrapper() {
  const params = useParams<{ companyId: string }>();
  const companyId = params.companyId;

  console.log("CompanyId from URL:", companyId); // should log 689c59174bd8ff800022c93d

  return (
    <div>
      <RecruiterListPage companyId={companyId} />
    </div>
  );
}

export default RecruiterListWrapper;
