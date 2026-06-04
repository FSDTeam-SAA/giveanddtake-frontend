import { NextRequest, NextResponse } from 'next/server'
import { getBackendHeaders } from '@/lib/server-auth'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()

        // multipart body: let fetch set the Content-Type/boundary itself,
        // only forward the Authorization header.
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/message`,
            {
                method: 'POST',
                headers: await getBackendHeaders(),
                body: formData,
            }
        )

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Failed to send message' },
            { status: 500 }
        )
    }
}
