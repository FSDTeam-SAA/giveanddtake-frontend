"use client"

import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"

// Define the type for a single notification
interface Notification {
  id: string
  message: string
  timestamp: string
  isRead: boolean
}

// Define the type for the API response
interface ApiResponse {
  success: boolean
  message: string
  data: Notification[]
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  // Mock data for demonstration purposes
  const mockNotifications: Notification[] = [
    {
      id: "1",
      message: "Your application for **UI Designer** at Adobe has been viewed.",
      timestamp: "2 hours ago",
      isRead: false,
    },
    {
      id: "2",
      message: "You've been invited to an interview by Shopify for the role **Frontend Developer**.",
      timestamp: "3 hours ago",
      isRead: false,
    },
    {
      id: "3",
      message: "Your application for **UI Designer** at Adobe has been viewed.",
      timestamp: "4 hours ago",
      isRead: true,
    },
    {
      id: "4",
      message: "Your application for **UI Designer** at Adobe has been viewed.",
      timestamp: "2 hours ago",
      isRead: false,
    },
    {
      id: "5",
      message: "You've been invited to an interview by Shopify for the role **Frontend Developer**.",
      timestamp: "3 hours ago",
      isRead: true,
    },
    {
      id: "6",
      message: "Your application for **UI Designer** at Adobe has been viewed.",
      timestamp: "4 hours ago",
      isRead: false,
    },
    {
      id: "7",
      message: "You've been invited to an interview by Shopify for the role **Frontend Developer**.",
      timestamp: "3 hours ago",
      isRead: true,
    },
    {
      id: "8",
      message: "Your application for **UI Designer** at Adobe has been viewed.",
      timestamp: "4 hours ago",
      isRead: false,
    },
  ]

  const {
    data: notifications = mockNotifications, // Default to mockNotifications
    isLoading,
    isError,
    error,
  } = useQuery<Notification[], Error>({
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) {
        return mockNotifications
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/notifications/${userId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()
      if (result.success) {
        return result.data.length > 0 ? result.data : mockNotifications
      } else {
        throw new Error(result.message || "Failed to fetch notifications.")
      }
    },
    enabled: !!userId,
    initialData: mockNotifications,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Updated from cacheTime to gcTime (React Query v5)
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Animation variants for staggered list items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  // Function to render message with bolded parts
  const renderMessage = (message: string) => {
    const parts = message.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <div className="container mx-auto py-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          Notification
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {unreadCount}
          </span>
        </h1>
        <button className="text-sm text-gray-500 hover:text-gray-700">Mark As Read</button>
      </div>

      {isLoading && <div className="text-center text-gray-500">Loading notifications...</div>}
      {isError && (
        <div className="text-center text-red-500">Error: {error?.message || "An unknown error occurred."}</div>
      )}

      {!isLoading && notifications.length === 0 && !isError && (
        <div className="text-center text-gray-500">No notifications found.</div>
      )}

      <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
        {notifications.map((notification: Notification) => (
          <motion.div
            key={notification.id}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg shadow-sm transition-colors duration-200",
              notification.isRead ? "bg-white" : "bg-blue-50",
            )}
            variants={itemVariants}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-user"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-grow">
              <p className="text-sm text-gray-800 leading-snug">{renderMessage(notification.message)}</p>
              <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
            </div>
            {!notification.isRead && (
              <span
                className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full ml-auto"
                aria-label="Unread notification"
              />
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}