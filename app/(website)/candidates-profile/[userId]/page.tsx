import React from "react";
import Candidates from "../../recruiters-profile/_components/candidates";

interface PageProps {
  params: {
    userId: string;
  };
}

function Page({ params }: PageProps) {
  const { userId } = params;

  return (
    <div>
      <Candidates userId={userId} />
    </div>
  );
}

export default Page;
