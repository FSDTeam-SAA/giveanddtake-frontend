import { NextRequest, NextResponse } from 'next/server'
import { getBackendHeaders } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/message-room/get-message-rooms?type=${type}&userId=${userId}`,
            {
                headers: await getBackendHeaders({
                    'Content-Type': 'application/json',
                }),
            }
        )

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch message rooms' },
            { status: 500 }
        )
    }
}
