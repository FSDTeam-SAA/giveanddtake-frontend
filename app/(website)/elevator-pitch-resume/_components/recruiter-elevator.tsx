import React from 'react'

export default function RecruiterElevator({ recruiter }: { recruiter: { aboutUs: string } }) {
    return (
        <div>
            <div className="lg:pb-12 pb-5">
                <h2 className='text-xl lg:text-4xl font-bold text-center'>Elevator Pitch</h2>
            </div>
            <div className="lg:space-y-8 space-y-4">
                <h2 className='text-xl lg:text-2xl font-bold'>About Us</h2>
                <p className='lg:text-xl text-base'>{recruiter?.aboutUs}</p>
            </div>
        </div>
    )
}
