"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageBubble } from "./message-bubble";
import { FileUpload } from "./file-upload";
import { Send, Smile, ArrowLeft } from "lucide-react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import type { ChatMessage, PagedMessages } from "./messaging";
import Link from "next/link";

interface ChatAreaProps {
  roomId: string;
  userId?: string;
  socket?: Socket;
  roomName: string;
  userRole?: string;
  roomAvatarUrl?: string;
  onBackToList?: () => void;
}

interface SideUser {
  _id: string;
}
interface MessageRoom {
  _id: string;
  userId: SideUser;
  messsageAccepted: boolean;
  lastMessage: string;
  lastMessageSender?: string;
  createdAt: string;
  updatedAt: string;
}

export function ChatArea({
  roomId,
  userId,
  socket,
  onBackToList,
  roomName,
  userRole,
  roomAvatarUrl,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: rooms = [] } = useQuery<MessageRoom[]>({
    queryKey: ["message-rooms", userId, userRole],
    queryFn: async () => {
      if (!userId || !userRole) return [];
      const response = await fetch(
        `/api/message-room/get-message-rooms?type=${userRole}&userId=${userId}`
      );
      const data = await response.json();
      return data.success ? (data.data as MessageRoom[]) : [];
    },
    enabled: !!userId && !!userRole,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  const candidateId = rooms[0]?.userId?._id;

  const senderIdOf = (u: ChatMessage["userId"]) =>
    typeof u === "string" ? u : u?._id ?? "";

  const isNearBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return false;
    const threshold = 80;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<PagedMessages>({
      queryKey: ["messages", roomId],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await fetch(
          `/api/message/${roomId}?page=${pageParam}&limit=20`
        );
        const json = await response.json();
        if (!json?.success)
          return { data: [], meta: { page: 1, totalPages: 1 } };
        return json as PagedMessages;
      },
      getNextPageParam: (lastPage) => {
        const { page, totalPages } = lastPage.meta;
        return page < totalPages ? page + 1 : undefined;
      },
      initialPageParam: 1,
      enabled: !!roomId,
      staleTime: 5_000,
    });

  const allMessages: ChatMessage[] = useMemo(
    () => (data?.pages.flatMap((p) => p.data) ?? []).reverse(),
    [data]
  );

  // Join/leave rooms & realtime stream
  useEffect(() => {
    if (!socket || !roomId) return;

    if (currentRoom && currentRoom !== roomId)
      socket.emit("leaveRoom", currentRoom);
    socket.emit("joinRoom", roomId);
    setCurrentRoom(roomId);

    const handleNewMessage = (newMessage: ChatMessage) => {
      if (newMessage.roomId !== roomId) {
        queryClient.invalidateQueries({ queryKey: ["message-rooms"] });
        return;
      }

      queryClient.setQueryData(
        ["messages", roomId],
        (
          oldData: { pages: PagedMessages[]; pageParams: unknown[] } | undefined
        ) => {
          if (!oldData) {
            return {
              pages: [{ data: [newMessage], meta: { page: 1, totalPages: 1 } }],
              pageParams: [1],
            };
          }
          const exists = oldData.pages.some((pg) =>
            pg.data.some((m) => m._id === newMessage._id)
          );
          if (exists) return oldData;

          const pages = [...oldData.pages];
          const first = pages[0] ?? {
            data: [],
            meta: { page: 1, totalPages: 1 },
          };
          pages[0] = { ...first, data: [newMessage, ...first.data] }; // newest page prepend
          return { ...oldData, pages };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["message-rooms"] });
      if (isNearBottom() || senderIdOf(newMessage.userId) === userId) {
        requestAnimationFrame(scrollToBottom);
      }
    };

    socket.on("newMessage", handleNewMessage);

    // ✅ cleanup must return void
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, roomId, currentRoom, queryClient, userId]);

  // Scroll to bottom once loaded
  useEffect(() => {
    if (!isLoading) requestAnimationFrame(scrollToBottom);
  }, [isLoading, roomId]);

  const appendLocalMessage = (created: ChatMessage) => {
    queryClient.setQueryData(
      ["messages", roomId],
      (
        oldData: { pages: PagedMessages[]; pageParams: unknown[] } | undefined
      ) => {
        if (!oldData) {
          return {
            pages: [{ data: [created], meta: { page: 1, totalPages: 1 } }],
            pageParams: [1],
          };
        }
        const pages = [...oldData.pages];
        const first = pages[0] ?? {
          data: [],
          meta: { page: 1, totalPages: 1 },
        };
        pages[0] = { ...first, data: [created, ...first.data] };
        return { ...oldData, pages };
      }
    );
    queryClient.invalidateQueries({ queryKey: ["message-rooms"] });
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/message", {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
    onSuccess: (resp) => {
      if (resp?.success && resp?.data)
        appendLocalMessage(resp.data as ChatMessage);
      else toast.error(resp?.message || "Failed to send message.");
      setMessage("");
      setFiles([]);
    },
    onError: () => toast.error("Failed to send message."),
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append("userId", userId || "");
    formData.append("roomId", roomId);
    formData.append("message", message);
    files.forEach((file) => formData.append("files", file));

    sendMessageMutation.mutate(formData);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[85vh]">
      {/* Header */}
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
        <Link
          href={`/candidates-profile/${candidateId}`}
          className="flex items-center"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={
                roomAvatarUrl ||
                `/placeholder.svg?height=40&width=40&text=${
                  roomName?.charAt(0) || "U"
                }`
              }
            />
            <AvatarFallback>{roomName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="ml-3 flex-1 min-w-0">
            <h2 className="font-semibold truncate">
              {roomName || "Conversation"}
            </h2>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
        ref={messagesContainerRef}
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        )}

        {allMessages.map((msg, index) => {
          const currSender = senderIdOf(msg.userId);
          const prevSender =
            index > 0 ? senderIdOf(allMessages[index - 1].userId) : "";
          return (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={currSender === userId}
              showAvatar={index === 0 || prevSender !== currSender}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="flex items-center space-x-1 md:space-x-2">
              <FileUpload files={files} onFilesChange={setFiles} />
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message"
                className="flex-1 text-base"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2 flex-shrink-0"
                title="Emoji"
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
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
