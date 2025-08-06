import React from 'react'

export default function ApplicantDetails({ applicantId }: { applicantId: string }) {
    return (
        <div>
            <h1>Applicant Details</h1>
            <p>Applicant ID: {applicantId}</p>
        </div>
    )
}
