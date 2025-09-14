"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSession } from "next-auth/react"

interface UserData {
  _id: string
  name: string
  email: string
  phoneNum: string
  role: string
  avatar?: { url: string }
}

interface RequestData {
  _id: string
  userId: UserData
  company: string
  status: string
  createdAt: string
  updatedAt: string
  __v: number
}

interface UpdateStatusResponse {
  success: boolean
  message: string
  data: RequestData
}

interface PendingEmployeeRequestProps {
  companyId: string
  requests: RequestData[]
  setShowRequests: (value: boolean) => void
}

export default function PendingEmployeeRequest({
  companyId,
  requests,
  setShowRequests,
}: PendingEmployeeRequestProps) {
  const [showRequests, setLocalShowRequests] = useState(false)
  const queryClient = useQueryClient()
  const session = useSession()
  const token = session.data?.accessToken



  const companyid = requests[0]?.company


  const requireterId = requests[0]?.userId._id

  console.log("requireters", requireterId)

  const updateStatusMutation = useMutation<
    UpdateStatusResponse,
    Error,
    { requestId: string; status: string }
  >({
    mutationFn: async ({ requestId, status }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/update-company-employee/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, companyId: companyid, userId: requireterId }),
        }
      )

      if (!res.ok) throw new Error("Failed to update request status")

      const response = (await res.json()) as UpdateStatusResponse
      if (!response.success) {
        throw new Error(response.message || "Failed to update request status")
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", companyId] })
    },
    onError: (error) => {
      console.error("Error updating status:", error.message)
    },
  })

  const handleStatusUpdate = (requestId: string, newStatus: string) => {
    updateStatusMutation.mutate({ requestId, status: newStatus })
  }

  const handleToggleRequests = () => {
    setLocalShowRequests(!showRequests)
    setShowRequests(!showRequests) // sync with parent
  }

  return (
    <div>
      <div className="mb-4">
        <Button onClick={handleToggleRequests}>
          {showRequests ? "Hide Recruiter Requests" : "Show All Recruiter Requests"}
        </Button>
      </div>

      {showRequests && (
        <div className="mt-6 bg-white rounded-lg border">
          <h2 className="text-xl font-semibold mb-4 p-4">Recruiter Requests</h2>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-medium text-gray-700">User</TableHead>
                <TableHead className="font-medium text-gray-700">Status</TableHead>
                <TableHead className="font-medium text-gray-700">Created At</TableHead>
                <TableHead className="font-medium text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req._id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={req.userId.avatar?.url || "/placeholder.svg"}
                          alt={req.userId.name}
                        />
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                          {req.userId.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">{req.userId.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`
                        ${req.status.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-800" : ""}
                        ${req.status.toLowerCase() === "approved" ? "bg-green-100 text-green-800" : ""}
                        ${req.status.toLowerCase() === "rejected" ? "bg-red-100 text-red-800" : ""}
                      `}
                    >
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {req.status.toLowerCase() === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                            onClick={() => handleStatusUpdate(req._id, "accepted")}
                            disabled={updateStatusMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                            onClick={() => handleStatusUpdate(req._id, "rejected")}
                            disabled={updateStatusMutation.isPending}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
