'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        const socketInstance = io('https://giveandtake-backend.onrender.com')
        setSocket(socketInstance)

        return () => {
            socketInstance.disconnect()
        }
    }, [])

    return socket
}
