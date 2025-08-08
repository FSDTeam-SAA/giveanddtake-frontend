"use client"

import Link from 'next/link'
import React from 'react'
import CreateResumeForm from './create-resume-form'
import { useQuery } from '@tanstack/react-query'
import { getMyResume, getRecruiterAccount } from '@/lib/api-service'
import MyResume from './resume'
import { useSession } from 'next-auth/react'
import RecruiterAccount from './recruiter-account'

export default function ElevatorPitchAndResume() {

    const { data: session } = useSession();

    const { data: myresume } = useQuery({
        queryKey: ["my-resume"],
        queryFn: getMyResume,
        select: (data) => data?.data
    })

    console.log("My resume here: ", myresume)

    const { data: recruiter } = useQuery({
        queryKey: ['recruiter'],
        queryFn: () => getRecruiterAccount(session?.user?.id || ""),
        select: (data) => data?.data
    })


    console.log("Recruiter account info: ", recruiter)

    return (
        <section className='py-8 lg:py-20'>
            <div className='container mx-auto lg:px-6'>
                {
                    (!myresume || !recruiter) ?
                        (
                            <div className="">
                                <div className="flex justify-center items-center relative lg:mb-12">
                                    <div className="flex items-center">
                                        <h2 className='text-5xl font-bold text-center'>Create Your Elevator Pitch & Resume</h2>
                                        <Link href="/" className='text-v0-blue-500 absolute top-1/2 right-0 -translate-y-1/2'>
                                            Skip
                                        </Link>
                                    </div>
                                </div>
                                {
                                    session?.user?.role === "candidate" ?
                                        (
                                            <CreateResumeForm />
                                        )
                                        :
                                        (
                                            <h2>Hello</h2>
                                        )
                                }
                            </div>
                        )
                        :
                        (

                            session?.user?.role === "candidate" ?
                                (

                                    <MyResume resume={myresume} />
                                )
                                :
                                (
                                    <div className="">
                                        <RecruiterAccount recruiter={recruiter} />
                                    </div>
                                )

                        )
                }
            </div>
        </section>
    )
}
