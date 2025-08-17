"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "../ui/button";

interface MessageRoom {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  recruiterId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  messsageAccepted: boolean;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageSidebarProps {
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string, roomName: string) => void;
  userId?: string;
  userRole?: string;
  roomName?: string;
}

export function MessageSidebar({
  selectedRoomId,
  roomName,
  onRoomSelect,
  userId,
  userRole,
}: MessageSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["message-rooms", userId, userRole],
    queryFn: async () => {
      if (!userId || !userRole) return [];

      const response = await fetch(
        `/api/message-room/get-message-rooms?type=${userRole}&userId=${userId}`
      );
      const data = await response.json();
      return data.success ? data.data : [];
    },
    enabled: !!userId && !!userRole,
  });

  const filteredRooms =
    rooms?.filter((room: MessageRoom) => {
      const otherUser =
        room?.userId?._id === userId ? room.recruiterId : room.userId;
      return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }) || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Messaging</h1>
          <div className="">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search in dashboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <p className="text-gray-500">No messages found</p>
          <div className="">
            <Link href="/alljobs">
              <Button className="bg-[#007bff] hover:bg-[#0069d9] text-white px-6 py-3 rounded-md text-base">
                Return To Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-xl font-semibold mb-4">Messaging</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search in dashboard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredRooms.map((room: MessageRoom) => {
          const otherUser =
            room.userId._id === userId ? room.recruiterId : room.userId;
          const isSelected = selectedRoomId === room._id;

          return (
            <div
              key={room._id}
              onClick={() => onRoomSelect(room._id, otherUser.name)}
              className={cn(
                "flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b transition-colors active:bg-gray-100",
                "md:hover:bg-gray-50", // Only hover on desktop
                isSelected && "bg-blue-50 md:border-r-2 md:border-r-blue-500"
              )}
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={`/placeholder.svg?height=48&width=48&text=${otherUser.name.charAt(
                      0
                    )}`}
                  />
                  <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">
                    {otherUser.name}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(room.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 truncate pr-2">
                    {room.lastMessage || "No messages yet"}
                  </p>
                  {otherUser.role === "recruiter" && (
                    <Badge
                      variant="secondary"
                      className="text-xs flex-shrink-0"
                    >
                      {otherUser.role}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
