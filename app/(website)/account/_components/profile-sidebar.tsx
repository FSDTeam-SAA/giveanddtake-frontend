"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Lock, Calendar, LogOut, Camera, Menu } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

async function fetchUserData(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

async function updateAvatar({ token, file }: { token: string; file: File }) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/update`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update avatar");
  }
  return response.json();
}

export function ProfileSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const token = session?.accessToken || "";
  const role = session?.user?.role as string | undefined;

  const [isOpen, setIsOpen] = useState(false); // mobile sheet
  const [confirmOpen, setConfirmOpen] = useState(false); // modal state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user data
  const { data: userData, isLoading: isUserDataLoading } = useQuery({
    queryKey: ["userData", token],
    queryFn: () => fetchUserData(token),
    enabled: !!token, // Only fetch if token exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Mutation for updating avatar
  const avatarMutation = useMutation({
    mutationFn: updateAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData", token] });
      toast.success("Avatar updated successfully!");
      setConfirmOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update avatar: ${error.message}`);
    },
  });

  // Define menu items and filter out "Job History" for recruiters/companies
  const menuItems = useMemo(
    () =>
      [
        { href: "/account", label: "Personal Information", icon: User },
        {
          href: "/account/change-password",
          label: "Change Password",
          icon: Lock,
        },
        { href: "/account/job-history", label: "Job History", icon: Calendar },
        {
          href: "/account/payment-history",
          label: "Payment History",
          icon: Lock,
        },
      ].filter(
        (item) =>
          !(
            (role === "recruiter" || role === "company") &&
            item.href === "/account/job-history"
          )
      ),
    [role]
  );

  // Handle loading state with skeleton loader
  if (status === "loading" || isUserDataLoading) {
    return (
      <div className="hidden xl:block w-72 2xl:w-80 bg-white min-h-screen p-6 border-r border-gray-100">
        <div className="animate-pulse">
          <div className="flex flex-col items-center mb-8">
            <div className="h-24 w-24 bg-gray-200 rounded-full mb-4" />
            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-40" />
          </div>
          <div className="space-y-2 px-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-100 mt-16">
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setConfirmOpen(true);
  };

  // Clean up preview URL when dialog closes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const confirmUpload = () => {
    if (!selectedFile) return;
    avatarMutation.mutate({ token, file: selectedFile });
  };

  const cancelUpload = () => {
    setConfirmOpen(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center mb-6 p-6">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={
                userData?.data?.avatar?.url || "https://via.placeholder.com/150"
              }
              alt={session?.user?.name || "User Avatar"}
            />
            <AvatarFallback className="text-xl bg-gray-200">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
            aria-label="Upload new avatar"
            disabled={avatarMutation.isPending}
          >
            <Camera className="h-4 w-4 text-white" aria-hidden="true" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            aria-hidden="true"
          />
        </div>
        <h3 className="font-semibold text-lg sm:text-xl text-gray-900 text-center">
          {session?.user?.name || "User"}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 text-center break-all">
          {session?.user?.email || "No email provided"}
        </p>
      </div>

      <nav className="flex-1 px-3 sm:px-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 sm:p-6 border-t border-gray-100 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-medium"
          onClick={() => {
            setIsOpen(false);
            signOut({ callbackUrl: "/login" });
          }}
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: sticky trigger for easy access */}
      <div className="lg:hidden sticky top-16 z-30 px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-[#2B7FD0] text-white shadow-md hover:shadow-lg hover:bg-[#2b80d0]/80"
              aria-label="Open profile menu"
            >
              <span className="font-medium">Profile</span>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] sm:w-80 p-0 bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-semibold">
                Profile Menu
              </h2>
            </div>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 xl:w-72 2xl:w-80 bg-white border-r border-gray-100">
        <SidebarContent />
      </div>

      {/* Confirm change avatar dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => (o ? setConfirmOpen(true) : cancelUpload())}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change profile photo?</DialogTitle>
            <DialogDescription>
              This will replace your current profile picture. You can preview it
              below before confirming.
            </DialogDescription>
          </DialogHeader>

          {previewUrl ? (
            <div className="flex items-center gap-4">
              <img
                src={previewUrl}
                alt="Selected preview"
                className="h-20 w-20 rounded-full object-cover border"
              />
              <div className="text-sm text-gray-600">
                <p className="font-medium">New photo selected</p>
                <p className="mt-1">Click "Confirm" to upload.</p>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelUpload}
              disabled={avatarMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={confirmUpload} disabled={avatarMutation.isPending}>
              {avatarMutation.isPending ? "Uploading..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
