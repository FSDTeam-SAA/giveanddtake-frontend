"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { User, Lock, Calendar, LogOut, Camera, Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

async function updateAvatar({ token, file }: { token: string; file: File }) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/user/update`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to update avatar");
  }
  return response.json();
}

export function ProfileSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutation for updating avatar
  const avatarMutation = useMutation({
    mutationFn: updateAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData", session?.accessToken] });
      toast.success("Avatar updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update avatar: ${error.message}`);
    },
  });

  const menuItems = [
    { href: "/account", label: "Personal Information", icon: User },
    { href: "/account/change-password", label: "Change Password", icon: Lock },
    { href: "/account/job-history", label: "Job History", icon: Calendar },
    { href: "/account/payment-history", label: "Payment History", icon: Lock },
  ];

  // Handle loading state with skeleton loader
  if (status === "loading") {
    return (
      <div className="hidden lg:block w-80 lg:w-64 bg-white min-h-screen p-6 border-r border-gray-100">
        <div className="animate-pulse">
          {/* Avatar skeleton */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-24 w-24 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-40"></div>
          </div>
          {/* Menu items skeleton */}
          <div className="space-y-2 px-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          {/* Logout button skeleton */}
          <div className="p-6 border-t border-gray-100 mt-16">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
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
    const file = event.target.files?.[0];
    if (file) {
      avatarMutation.mutate({ token: session?.accessToken || "", file });
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center mb-8 p-6">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={session?.user?.image || "https://via.placeholder.com/150"}
              alt={session?.user?.name || "User Avatar"}
            />
            <AvatarFallback className="text-xl bg-gray-200">
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1.5"
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
        <h3 className="font-semibold text-xl text-gray-900 text-center">
          {session?.user?.name || "User"}
        </h3>
        <p className="text-sm text-gray-600 mt-1 text-center">
          {session?.user?.email || "No email provided"}
        </p>
      </div>

      <nav className="flex-1 px-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-50"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-100 mt-auto">
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
      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="top-24">
            <Button
              variant="outline"
              size="icon"
              className="bg-[#2B7FD0] shadow-md hover:shadow-lg hover:bg-[#2b80d070] px-16"
              aria-label="Open menu"
            >
              Profile <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-white" onInteractOutside={() => setIsOpen(false)}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Profile Menu</h2>
            </div>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 lg:w-64 bg-white border-r border-gray-100">
        <SidebarContent />
      </div>
    </>
  );
}