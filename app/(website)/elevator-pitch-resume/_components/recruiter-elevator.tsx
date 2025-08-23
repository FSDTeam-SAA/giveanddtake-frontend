import React from 'react'
import DOMPurify from "dompurify";

export default function RecruiterElevator({ recruiter }: { recruiter: { bio: string } }) {


  console.log(recruiter)
    return (
        <div>
            <div className="lg:pb-12 pb-5">
                <h2 className='text-xl lg:text-4xl font-bold text-center'>Elevator Pitch</h2>
            </div>
            <div className="lg:space-y-8 space-y-4  py-8">
                <h2 className='text-xl lg:text-2xl font-bold'>About Us</h2>

                 <div
                    className="text-gray-600 text-sm text-start"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(recruiter?.bio ||
                      "We connect top talent with great companies. Our mission is to make hiring simple, fast, and effective for everyone."),
                    }}
                  />
            </div>
        </div>
    )
}
