import type { Metadata } from 'next'
import React from 'react'
import ElevatorPitchAndResume from './_components/elevator-pitch-page'

export const metadata: Metadata = {
    title: { absolute: 'My Profile | Elevator Video Pitch' },
}

export default function page() {
    return (
        <main>
            <ElevatorPitchAndResume />
        </main>
    )
}
