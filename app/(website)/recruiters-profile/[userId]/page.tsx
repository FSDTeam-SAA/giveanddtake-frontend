import React from "react";
import Candidates from "../_components/candidates"; // ✅ fix

interface PageProps {
  params: {
    userId: string;
  };
}

function Page({ params }: PageProps) {
  const { userId } = params;

  return (
    <div>
      <Candidates userId={params.userId} />
    </div>
  );
}

export default Page;
