import React from "react";
import Recruiters from "../_components/recruiters";

interface PageProps {
  params: {
    userId: string;
  };
}

function Page({ params }: PageProps) {
  const { userId } = params;

  return (
    <div>
      <Recruiters userId={params.userId} />
    </div>
  );
}

export default Page;
