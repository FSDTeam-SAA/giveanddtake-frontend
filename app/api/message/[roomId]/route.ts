import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '20'

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/message/${params.roomId}?page=${page}&limit=${limit}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { messageId: string } }
) {
    try {
        const body = await request.json()

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/message/${params.messageId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            }
        )

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Failed to update message' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/message/${params.roomId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Failed to delete message' },
            { status: 500 }
        )
    }
}
