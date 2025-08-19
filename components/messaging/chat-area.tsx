"use client";

import { useState, useEffect, useRef } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "./message-bubble";
import { FileUpload } from "./file-upload";
import { Send, Smile, ArrowLeft } from "lucide-react";
import { Socket } from "socket.io-client";

interface Message {
  _id: string;
  userId: string;
  message: string;
  file: Array<{
    filename: string;
    url: string;
  }>;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatAreaProps {
  roomId: string;
  userId?: string;
  socket?: Socket;
  roomName: string;
  onBackToList?: () => void;
}

export function ChatArea({
  roomId,
  userId,
  socket,
  onBackToList,
  roomName,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["messages", roomId],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await fetch(
          `/api/message/${roomId}?page=${pageParam}&limit=20`
        );
        const data = await response.json();
        return data.success
          ? data
          : { data: [], meta: { page: 1, totalPages: 1 } };
      },
      getNextPageParam: (lastPage) => {
        const { page, totalPages } = lastPage.meta;
        return page < totalPages ? page + 1 : undefined;
      },
      initialPageParam: 1,
      enabled: !!roomId,
    });

  const sendMessageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/message", {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      setFiles([]);
      queryClient.invalidateQueries({
        queryKey: ["message-rooms", userId],
      });
    },
  });

  // Socket.io setup
  useEffect(() => {
    if (!socket || !roomId) return;

    if (currentRoom && currentRoom !== roomId) {
      socket.emit("leaveRoom", currentRoom);
    }

    socket.emit("joinRoom", roomId);
    setCurrentRoom(roomId);

    const handleNewMessage = (newMessage: Message) => {
      if (newMessage.roomId === roomId) {
        queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, roomId, currentRoom, queryClient]);

  // Auto scroll to bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [data]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append("userId", userId || "");
    formData.append("roomId", roomId);
    formData.append("message", message);

    files.forEach((file) => {
      formData.append("files", file);
    });

    sendMessageMutation.mutate(formData);
    queryClient.invalidateQueries({ queryKey: ["message-rooms"] });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const allMessages =
    data?.pages
      .flatMap((page) => (page as { data: Message[] }).data)
      .reverse() || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[85vh]">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white flex items-center">
        {onBackToList && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToList}
            className="mr-3 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Avatar className="w-10 h-10">
          <AvatarImage src="/placeholder.svg?height=40&width=40&text=U" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="ml-3 flex-1 min-w-0">
          <h2 className="font-semibold truncate">{roomName}</h2>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
        ref={messagesContainerRef}
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {allMessages.map((msg: Message, index) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.userId === userId}
            showAvatar={
              index === 0 || allMessages[index - 1]?.userId !== msg.userId
            }
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 md:p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="flex items-center space-x-1 md:space-x-2">
              <FileUpload files={files} onFilesChange={setFiles} />
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message"
                className="flex-1 text-base" // Prevent zoom on iOS
                disabled={sendMessageMutation.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2 flex-shrink-0"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={
              sendMessageMutation.isPending ||
              (!message.trim() && files.length === 0)
            }
            className="bg-primary hover:bg-blue-700 flex-shrink-0"
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
