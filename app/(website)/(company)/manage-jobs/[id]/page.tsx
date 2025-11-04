import React from 'react'
import ManagePage from '../_components/manage-jobs'

function Page({ params }: { params: { id: string } }) {
  const companyId = params.id;
  
  return (
    <div>
        <ManagePage userId={companyId} />
    </div>
  )
}

export default Page