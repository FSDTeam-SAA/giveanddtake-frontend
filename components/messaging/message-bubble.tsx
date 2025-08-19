"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const queryClient = useQueryClient();

  const updateMessageMutation = useMutation({
    mutationFn: async ({
      messageId,
      newMessage,
    }: {
      messageId: string;
      newMessage: string;
    }) => {
      const response = await fetch(`/api/message/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      return response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["messages", message.roomId] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetch(`/api/message/${messageId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", message.roomId] });
    },
  });

  const handleEdit = () => {
    if (editText.trim() !== message.message) {
      updateMessageMutation.mutate({
        messageId: message._id,
        newMessage: editText.trim(),
      });
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessageMutation.mutate(message._id);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderFilePreview = (file: { filename: string; url: string }) => {
    const ext = file.filename.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
      return (
        <img
          src={file.url || "/placeholder.svg"}
          alt={file.filename}
          className="max-w-[200px] sm:max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90"
          onClick={() => window.open(file.url, "_blank")}
        />
      );
    } else if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext || "")) {
      return (
        <video
          src={file.url}
          controls
          className="max-w-[200px] sm:max-w-xs max-h-48 rounded-lg"
        />
      );
    } else {
      return (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <span className="font-medium truncate max-w-[150px]">
            {file.filename}
          </span>
        </a>
      );
    }
  };

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[85%] sm:max-w-xs lg:max-w-md",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        {showAvatar && !isOwn && (
          <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
            <AvatarImage src="/placeholder.svg?height=32&width=32&text=U" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        )}

        <div
          className={cn(
            "mx-2",
            showAvatar && !isOwn && "ml-2",
            showAvatar && isOwn && "mr-2"
          )}
        >
          <div className="group relative">
            <div
              className={cn(
                "px-3 py-2 md:px-4 md:py-2 rounded-2xl break-words",
                isOwn ? "bg-primary text-white" : "bg-gray-200 text-gray-900"
              )}
            >
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="text-sm bg-transparent border-none p-0 focus:ring-0"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit();
                      if (e.key === "Escape") setIsEditing(false);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEdit}
                    disabled={updateMessageMutation.isPending}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  {message.message && (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.message}
                    </p>
                  )}
                  {message.file && message.file.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.file.map((file, index) => (
                        <div key={index}>{renderFilePreview(file)}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {isOwn && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -left-6 md:-left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600"
                    disabled={deleteMessageMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div
            className={cn(
              "text-xs text-gray-500 mt-1",
              isOwn ? "text-right" : "text-left"
            )}
          >
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
