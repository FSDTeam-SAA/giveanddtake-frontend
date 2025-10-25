import React from "react";
import EditCompanyPage from "../../_components/edit-company-profile";

interface PageProps {
  params: {
    id: string;
  };
}

const Page = ({ params }: PageProps) => {
  const { id } = params;

  return (
    <div>
      <EditCompanyPage companyId={id} />
    </div>
  );
};

export default Page;
