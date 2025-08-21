import React from "react";
import Candidates from "../_components/candidates";

interface PageProps {
  params: {
    userId: string;
  };
}

function Page({ params }: PageProps) {
  const { userId } = params;

  return (
    <div className="container max-auto">
      <Candidates  userId={userId}/>
    </div>
  );
}

export default Page;
