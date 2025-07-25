import Link from 'next/link'
import React from 'react'
import CreateResumeForm from './create-resume-form'

export default function ElevatorPitchAndResume() {
    return (
        <section className='py-8 lg:py-20'>
            <div className='container mx-auto'>
                <div className="flex justify-center items-center relative lg:mb-12">
                    <div className="flex items-center">
                        <h2 className='text-5xl font-bold text-center'>Create Your Elevator Pitch & Resume</h2>
                        <Link href="/" className='text-v0-blue-500 absolute top-1/2 right-0 -translate-y-1/2'>
                            Skip
                        </Link>
                    </div>
                </div>
                <CreateResumeForm />
            </div>
        </section>
    )
}
