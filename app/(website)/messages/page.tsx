'use client'

import { useState, useEffect } from 'react'
import { MessageSidebar } from '@/components/messaging/message-sidebar'
import { ChatArea } from '@/components/messaging/chat-area'
import { useSocket } from '@/hooks/use-socket'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

const queryClient = new QueryClient()

export default function MessagingPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <MessagingContent />
        </QueryClientProvider>
    )
}

function MessagingContent() {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
    const [isMobileView, setIsMobileView] = useState(false)
    const { data: session } = useSession()
    const socket = useSocket()
    const [roomName, setRoomName] = useState('')


    // Check if we're on mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobileView(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleRoomSelect = (roomId: string, roomName: string) => {
        setSelectedRoomId(roomId)
        setRoomName(roomName)
    }

    const handleBackToList = () => {
        setSelectedRoomId(null)
    }

    console.log("SELECTED ROOM ID: ", selectedRoomId)

    return (
        <div className="flex h-screen bg-gray-50 container">
            {/* Mobile: Show either sidebar or chat, Desktop: Show both */}
            <div className={`
        ${isMobileView
                    ? (selectedRoomId ? 'hidden' : 'w-full')
                    : 'w-52 lg:w-80 border-r'
                } bg-white
      `}>
                <MessageSidebar
                    selectedRoomId={selectedRoomId}
                    onRoomSelect={handleRoomSelect}
                    userId={session?.user?.id}
                    roomName={roomName}
                    userRole={session?.user?.role}
                />
            </div>

            <div className={`
        ${isMobileView
                    ? (selectedRoomId ? 'w-full' : 'hidden')
                    : 'flex-1'
                }
      `}>
                {selectedRoomId ? (
                    <ChatArea
                        roomId={selectedRoomId}
                        userId={session?.user?.id}
                        socket={socket ?? undefined}
                        onBackToList={isMobileView ? handleBackToList : undefined}
                        roomName={roomName}
                    />
                ) : (
                    !isMobileView && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select a conversation to start messaging
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
