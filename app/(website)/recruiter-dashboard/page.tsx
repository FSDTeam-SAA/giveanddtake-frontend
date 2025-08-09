"use client"

import React from 'react'
import JobList from './_components/joblist'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { getRecruiterJobs } from '@/lib/api-service'
import { Loader } from 'lucide-react'
import RecruiterInfo from './_components/recruiter-info'

export default function RecruiterDashboardPage() {

    const { data: jobs, isLoading, error, isError } = useQuery({
        queryKey: ['jobs'],
        queryFn: getRecruiterJobs,
        select: (data) => data?.data
    })

    if (isLoading) {
        return (
            <main>
                <section className='py-8 lg:py-20'>
                    <div className="container space-y-6 lg:space-y-12">
                        <div className="text-center">
                            <h2 className='text-xl lg:text-4xl font-bold'>Recruiter Dashboard</h2>
                        </div>
                        <div className="flex justify-center items-center">
                            <Loader className="animate-spin" />
                        </div>
                    </div>
                </section>
            </main>
        )
    }


    if (isError) {
        return (
            <main>
                <section className='py-8 lg:py-20'>
                    <div className="container space-y-6 lg:space-y-12">
                        <div className="text-center">
                            <h2 className='text-xl lg:text-4xl font-bold'>Recruiter Dashboard</h2>
                        </div>
                        <p className='text-center text-red-500'>{error.message}</p>
                    </div>
                </section>
            </main>
        )
    }

    const isNoJob = jobs?.length === 0

    return (
        <main>
            <section className='py-8 lg:py-20'>
                <div className={`container lg:px-5 ${isNoJob ? 'space-y-3 lg:space-y-6' : 'space-y-6 lg:space-y-12'}`}>
                    <div className="text-center">
                        <h2 className='text-xl lg:text-5xl font-bold'>Recruiter Dashboard</h2>
                    </div>
                    {
                        isNoJob ?
                            (
                                <div className="space-y-5 lg:space-y-10">
                                    <h4 className='text-center text-lg'>Start hiring top talent by posting your first job.</h4>
                                    <RecruiterInfo />
                                </div>
                            )
                            :
                            (
                                <div className="">
                                    <JobList />
                                    <Link href="/post-job" className='flex justify-center'>
                                        <Button className='bg-[#2B7FD0]/90 hover:bg-[#2B7FD0]'>Post A Job</Button>
                                    </Link>
                                </div>
                            )
                    }

                </div>
            </section>
        </main>
    )
}
