import React from 'react'
import JobList from './_components/joblist'

export default function RecruiterDashboardPage() {
    return (
        <main>
            <section className='py-8 lg:py-20'>
                <div className="container">
                    <div className="text-center lg:pb-20 pb-5">
                        <h2 className='text-xl lg:text-4xl font-bold'>Recruiter Dashboard</h2>
                    </div>
                    <JobList />
                </div>
            </section>
        </main>
    )
}
