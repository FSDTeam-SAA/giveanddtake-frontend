import React from 'react'
import ManagePage from '../_components/manage-jobs'

function Page({ params }: { params: { id: string } }) {
  const companyId = params.id;
  console.log("Company ID in manage jobs page is: ", companyId);
  
  return (
    <div>
        <ManagePage userId={companyId} />
    </div>
  )
}

export default Page