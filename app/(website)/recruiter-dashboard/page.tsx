import React from 'react'
import JobList from './_components/joblist'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RecruiterDashboardPage() {
    return (
        <main>
            <section className='py-8 lg:py-20'>
                <div className="container space-y-6 lg:space-y-12">
                    <div className="text-center">
                        <h2 className='text-xl lg:text-4xl font-bold'>Recruiter Dashboard</h2>
                    </div>
                    <JobList />
                    <Link href="/post-job" className='flex justify-center'>
                        <Button className='bg-[#2B7FD0]/90 hover:bg-[#2B7FD0]'>Post A Job</Button>
                    </Link>
                </div>
            </section>
        </main>
    )
}
