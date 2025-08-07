import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/message`,
            {
                method: 'POST',
                body: formData,
            }
        )

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Failed to send message' },
            { status: 500 }
        )
    }
}
