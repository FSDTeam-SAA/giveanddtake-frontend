"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  MessageCircle,
  Menu,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Video,
  UserPlus as UserPen,
  Settings,
  Bookmark,
  CreditCard,
} from "lucide-react";
import { ScrollingInfoBar } from "./scrolling-info-bar";
import { GlobalSearch } from "../global-search";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  getCompanyAccount,
  getMyResume,
  getRecruiterAccount,
} from "@/lib/api-service";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isViewed: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Notification[];
}

export function SiteHeader() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const pathname = usePathname();
  const [userAvatar, setUserAvatar] = useState("");
  const [userName, setUserName] = useState("");

  const userRole = session?.user?.role; // 'candidate', 'recruiter', 'company'
  const userId = session?.user?.id;

  // Fetch notifications using useQuery
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
  } = useQuery<Notification[], Error>({
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<Notification[]> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/notifications/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch notifications.");
      }
    },
    enabled: !!userId && status === "authenticated",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Calculate unread notifications count
  const unreadCount = notifications.filter(
    (notification) => !notification.isViewed
  ).length;

  // Resume query (only if role is candidate)
  const { data: myresume, isLoading: resumeLoading } = useQuery({
    queryKey: ["my-resume"],
    queryFn: getMyResume,
    select: (data) => data?.data,
    enabled: userRole === "candidate" && !!userId,
  });

  // Recruiter query (only if role is recruiter)
  const { data: recruiter, isLoading: recruiterLoading } = useQuery({
    queryKey: ["recruiter", userId],
    queryFn: () => getRecruiterAccount(userId || ""),
    select: (data) => data?.data,
    enabled: userRole === "recruiter" && !!userId,
  });

  // Company query (only if role is neither candidate nor recruiter)
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["company-account", userId],
    queryFn: () => getCompanyAccount(userId || ""),
    select: (data) => data?.data,
    enabled: userRole !== "candidate" && userRole !== "recruiter" && !!userId,
  });

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated" && session?.accessToken) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
            }
          );
          const result = await response.json();
          if (result.success) {
            setUserAvatar(result.data.avatar.url || "");
            setUserName(result.data.name || "U");
          } else {
            console.error("Failed to fetch user data:", result.message);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [status, session?.accessToken]);

  // Return an object with all relevant links for the user role
  const getDashboardLinks = () => {
    switch (userRole) {
      case "recruiter":
        return {
          dashboard: "/recruiter-dashboard",
          myPlan: "/my-plans",
          elevatorPitch: "/elevator-pitch",
          settings: "/account",
        };
      case "company":
        return {
          dashboard: "/elevator-pitch-resume",
          myPlan: "/my-plans",
          settings: "/account",
        };
      case "candidate":
        return {
          dashboard: "/account",
          myPlan: null,
          elevatorPitch: null,
          settings: "/account",
        };
      default:
        return {
          dashboard: "/dashboard",
          myPlan: null,
          elevatorPitch: null,
          settings: null,
        };
    }
  };

  const getProfileLink = () => {
    return userRole === "candidate" ? "/account" : "/dashboard";
  };

  // Helper function to check if a link is active
  const isActive = (href: string) => {
    return pathname === href;
  };

  const links = getDashboardLinks();

  // Helper function to determine Elevator Pitch link text
  const getElevatorPitchText = () => {
    if (
      (userRole === "candidate" &&
        !resumeLoading &&
        myresume?.data?.resume == null) ||
      (userRole === "recruiter" && !recruiterLoading && recruiter) ||
      (userRole === "company" && !companyLoading && company)
    ) {
      return "Elevator Pitch";
    }
    return "Create Elevator Pitch";
  };

  return (
    <div className="w-full">
      {/* Top Navbar */}
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 border-b">
        {/* Left Section: Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Image
              src={"/assets/evp-logo.jpg"}
              alt="Logo"
              width={500}
              height={500}
              className="h-[38px] lg:h-[48px] w-[100px] lg:w-[140px]"
            />
          </Link>
        </div>

        {/* Middle Section: Search Bar (visible on medium screens and up) */}
        <div className="hidden md:flex flex-1 justify-center max-w-lg mx-4">
          <GlobalSearch />
        </div>

        {/* Navigation Links (moved to right, hidden on smaller screens) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`transition-colors focus:outline-none ${
              isActive("/") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/alljobs"
            className={`transition-colors focus:outline-none ${
              isActive("/alljobs") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
            }`}
          >
            Jobs
          </Link>
          {token && (
            <Link
              href="/elevator-pitch-resume"
              className={`transition-colors focus:outline-none ${
                isActive("/elevator-pitch-resume")
                  ? "text-[#2B7FD0]"
                  : "hover:text-[#2B7FD0]"
              }`}
            >
              {getElevatorPitchText()}
            </Link>
          )}
          <Link
            href="/blogs"
            className={`transition-colors focus:outline-none ${
              isActive("/blog") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
            }`}
          >
            Blogs
          </Link>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`h-auto p-0 text-sm font-medium transition-colors focus:outline-none ${
                  pathname.startsWith("/help")
                    ? "text-[#2B7FD0]"
                    : "hover:text-[#2B7FD0]"
                }`}
              >
                Help & Info <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className={`p-0 ${isActive("/faq") ? "text-[#2B7FD0]" : ""}`}
              >
                <Link href="/faq" className="w-full px-2 py-1.5 block">
                  FAQ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`p-0 ${
                  isActive("/contact-us") ? "text-[#2B7FD0]" : ""
                }`}
              >
                <Link href="/contact-us" className="w-full px-2 py-1.5 block">
                  Contact Us
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`h-auto p-0 text-sm font-medium transition-colors focus:outline-none ${
                  pathname.startsWith("/more")
                    ? "text-[#2B7FD0]"
                    : "hover:text-[#2B7FD0]"
                }`}
              >
                More <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className={`p-0 ${
                  isActive("/about-us") ? "text-[#2B7FD0]" : ""
                }`}
              >
                <Link href="/about-us" className="w-full px-2 py-1.5 block">
                  About Us
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`p-0 ${
                  isActive("/careers") ? "text-[#2B7FD0]" : ""
                }`}
              >
                <Link href="/careers" className="w-full px-2 py-1.5 block">
                  Careers
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`p-0 ${
                  isActive("/privacy-policy") ? "text-[#2B7FD0]" : ""
                }`}
              >
                <Link
                  href="/privacy-policy"
                  className="w-full px-2 py-1.5 block"
                >
                  Privacy Policy
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`p-0 ${
                  isActive("/terms-condition") ? "text-[#2B7FD0]" : ""
                }`}
              >
                <Link
                  href="/terms-condition"
                  className="w-full px-2 py-1.5 block"
                >
                  Terms and Conditions
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Section: Action Buttons & Avatar or Login */}
        <div className="flex items-center gap-2 md:gap-4 md:ml-7">
          {status === "authenticated" ? (
            <>
              {/* Notifications Button with Unread Count Badge */}
              <Link href="/notifications" className="hidden lg:block relative">
                <Button
                  size="icon"
                  className="rounded-full bg-blue-500 text-white hover:bg-primary"
                >
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
                {unreadCount > 0 && !isLoading && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs font-semibold">
                    {unreadCount}
                  </span>
                )}
                {isLoading && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 rounded-full bg-gray-300 animate-pulse"></span>
                )}
              </Link>
              <Link href="/messages" className="hidden lg:block">
                <Button
                  size="icon"
                  className="rounded-full bg-blue-500 text-white hover:bg-primary"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="sr-only">Messages</span>
                </Button>
              </Link>
              <div className="hidden lg:block">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-10 w-10 cursor-pointer">
                      <AvatarImage src={userAvatar} alt="User Avatar" />
                      <AvatarFallback className="font-semibold">
                        {userName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(userRole === "recruiter" || userRole === "company") && (
                      <>
                        {links.dashboard && (
                          <DropdownMenuItem
                            className={`p-0 ${
                              isActive(links.dashboard) ? "text-[#2B7FD0]" : ""
                            }`}
                          >
                            <Link
                              href={links.dashboard}
                              className="flex items-center w-full px-2 py-1.5"
                            >
                              <LayoutDashboard className="mr-2 h-4 w-4" />{" "}
                              Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {links.elevatorPitch && (
                          <DropdownMenuItem
                            className={`p-0 ${
                              isActive(links.elevatorPitch)
                                ? "text-[#2B7FD0]"
                                : ""
                            }`}
                          >
                            <Link
                              href={links.elevatorPitch}
                              className="flex items-center w-full px-2 py-1.5"
                            >
                              <Video className="mr-2 h-4 w-4" /> Elevator Pitch
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {links.settings && (
                          <DropdownMenuItem
                            className={`p-0 ${
                              isActive(links.settings) ? "text-[#2B7FD0]" : ""
                            }`}
                          >
                            <Link
                              href={links.settings}
                              className="flex items-center w-full px-2 py-1.5"
                            >
                              <Settings className="mr-2 h-4 w-4" /> Settings
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="p-0">
                          <Link
                            href={
                              userRole === "recruiter"
                                ? "/recruiter-pricing"
                                : "/company-pricing"
                            }
                            className="flex items-center w-full px-2 py-1.5"
                          >
                            <CreditCard className="mr-2 h-4 w-4" /> My Plan
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {userRole === "candidate" && (
                      <>
                        <DropdownMenuItem
                          className={`p-0 ${
                            isActive(getProfileLink()) ? "text-[#2B7FD0]" : ""
                          }`}
                        >
                          <Link
                            href={getProfileLink()}
                            className="flex items-center w-full px-2 py-1.5"
                          >
                            <UserPen className="mr-2 h-4 w-4" /> Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={`p-0 ${
                            isActive("/bookmarks") ? "text-[#2B7FD0]" : ""
                          }`}
                        >
                          <Link
                            href="/bookmarks"
                            className="flex items-center w-full px-2 py-1.5"
                          >
                            <Bookmark className="mr-2 h-4 w-4" /> Bookmarks
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-0">
                          <Link
                            href="/user-pricing"
                            className="flex items-center w-full px-2 py-1.5"
                          >
                            <CreditCard className="mr-2 h-4 w-4" /> My Plan
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        signOut({
                          callbackUrl: "/",
                        })
                      }
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Link href="/login" className="hidden lg:block">
              <Button
                className={`bg-blue-500 hover:bg-primary text-white ${
                  isActive("/login") ? "bg-[#2B7FD0]" : ""
                }`}
              >
                Login
              </Button>
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-lg mb-6"
              >
                <Image
                  src={"/assets/evp-logo.jpg"}
                  alt="Logo"
                  width={500}
                  height={500}
                  className="h-[38px] w-[100px]"
                />
              </Link>
              <div className="mb-6 md:hidden">
                <GlobalSearch />
              </div>
              {status === "authenticated" && (
                <div className="space-y-2">
                  <Link href="/notifications" className="pb-2 relative">
                    <Button
                      size="sm"
                      className="w-full bg-blue-500 text-white hover:bg-primary my-5"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                      {unreadCount > 0 && !isLoading && (
                        <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold">
                          {unreadCount}
                        </span>
                      )}
                      {isLoading && (
                        <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-300 animate-pulse"></span>
                      )}
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <Button
                      size="sm"
                      className="w-full bg-blue-500 text-white hover:bg-primary mb-5"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages
                    </Button>
                  </Link>
                </div>
              )}
              <nav className="grid gap-4 text-sm font-medium">
                <Link
                  href="/"
                  className={`transition-colors focus:outline-none ${
                    isActive("/") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/alljobs"
                  className={`transition-colors focus:outline-none ${
                    isActive("/alljobs")
                      ? "text-[#2B7FD0]"
                      : "hover:text-[#2B7FD0]"
                  }`}
                >
                  Jobs
                </Link>
                {(userRole === "candidate" ||
                  userRole === "recruiter" ||
                  userRole === "company") && (
                  <Link
                    href="/elevator-pitch-resume"
                    className={`transition-colors focus:outline-none ${
                      isActive("/elevator-pitch-resume")
                        ? "text-[#2B7FD0]"
                        : "hover:text-[#2B7FD0]"
                    }`}
                  >
                    {getElevatorPitchText()}
                  </Link>
                )}
                <Link
                  href="/blog"
                  className={`transition-colors focus:outline-none ${
                    isActive("/blog")
                      ? "text-[#2B7FD0]"
                      : "hover:text-[#2B7FD0]"
                  }`}
                >
                  Blogs
                </Link>
                <div className="space-y-2">
                  <div className="font-medium text-gray-900">Help & Info</div>
                  <div className="pl-4 space-y-2">
                    <Link
                      href="/faq"
                      className={`block transition-colors focus:outline-none ${
                        isActive("/faq")
                          ? "text-[#2B7FD0]"
                          : "hover:text-[#2B7FD0]"
                      }`}
                    >
                      FAQ
                    </Link>
                    <Link
                      href="/contact-us"
                      className={`block transition-colors focus:outline-none ${
                        isActive("/contact-us")
                          ? "text-[#2B7FD0]"
                          : "hover:text-[#2B7FD0]"
                      }`}
                    >
                      Contact Us
                    </Link>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-gray-900">More</div>
                  <div className="pl-4 space-y-2">
                    <Link
                      href="/about-us"
                      className={`block transition-colors focus:outline-none ${
                        isActive("/about-us")
                          ? "text-[#2B7FD0]"
                          : "hover:text-[#2B7FD0]"
                      }`}
                    >
                      About Us
                    </Link>
                    <Link
                      href="/careers"
                      className={`block transition-colors focus:outline-none ${
                        isActive("/careers")
                          ? "text-[#2B7FD0]"
                          : "hover:text-[#2B7FD0]"
                      }`}
                    >
                      Careers
                    </Link>
                    <Link
                      href="/privacy-policy"
                      className={`block transition-colors focus:outline-none ${
                        isActive("/privacy-policy")
                          ? "text-[#2B7FD0]"
                          : "hover:text-[#2B7FD0]"
                      }`}
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href="/terms-condition"
                      className={`block transition-colors focus:outline-none ${
                        isActive("/terms-condition")
                          ? "text-[#2B7FD0]"
                          : "hover:text-[#2B7FD0]"
                      }`}
                    >
                      Terms and Conditions
                    </Link>
                  </div>
                </div>
                {status === "authenticated" ? (
                  <Button
                    onClick={() =>
                      signOut({
                        callbackUrl: "/",
                      })
                    }
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <Link href="/login">
                    <Button className="w-full bg-blue-500 hover:bg-primary text-white mt-4">
                      Login
                    </Button>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Bottom Blue Scrolling Bar */}
      <ScrollingInfoBar />
    </div>
  );
}