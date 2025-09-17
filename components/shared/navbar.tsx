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
  Settings,
  Bookmark,
  CreditCard,
  User,
} from "lucide-react";
import { ScrollingInfoBar } from "./scrolling-info-bar";
import { GlobalSearch } from "../global-search";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, Fragment } from "react";
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

  // NEW: control mobile sheet open state so we can close it when navigating
  const [sheetOpen, setSheetOpen] = useState(false);

  const userRole = session?.user?.role; // 'candidate', 'recruiter', 'company'
  const userId = session?.user?.id;
  const isValid = session?.user?.isValid === true ? true : false;

  const getUpgradePath = () => {
    switch (userRole) {
      case "recruiter":
        return "/recruiter-pricing";
      case "candidate":
        return "/user-pricing";
      case "company":
        return "/company-pricing";
      default:
        return null;
    }
  };

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

  // ---- Shared user dropdown content (used for desktop and mobile avatar) ----
  const UserMenuContent = () => (
    <DropdownMenuContent align="end">
      {(userRole === "recruiter" || userRole === "company") && (
        <Fragment>
          {links.dashboard && (
            <DropdownMenuItem asChild>
              <Link
                href={links.dashboard}
                className="flex items-center w-full px-2 py-1.5"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Link>
            </DropdownMenuItem>
          )}
          {links.elevatorPitch && (
            <DropdownMenuItem asChild>
              <Link
                href={links.elevatorPitch}
                className="flex items-center w-full px-2 py-1.5"
              >
                <Video className="mr-2 h-4 w-4" /> Elevator Pitch
              </Link>
            </DropdownMenuItem>
          )}
          {links.settings && (
            <DropdownMenuItem asChild>
              <Link
                href={links.settings}
                className="flex items-center w-full px-2 py-1.5"
              >
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
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
        </Fragment>
      )}
      {userRole === "candidate" && (
        <Fragment>
          <DropdownMenuItem asChild>
            <Link
              href={getProfileLink()}
              className="flex items-center w-full px-2 py-1.5"
            >
              <User className="mr-2 h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/bookmarks"
              className="flex items-center w-full px-2 py-1.5"
            >
              <Bookmark className="mr-2 h-4 w-4" /> Bookmarks
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/user-pricing"
              className="flex items-center w-full px-2 py-1.5"
            >
              <CreditCard className="mr-2 h-4 w-4" /> My Plan
            </Link>
          </DropdownMenuItem>
        </Fragment>
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
  );

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

        {/* Navigation Links (desktop) */}
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

          <Link
            href="/elevator-pitch-resume"
            className={`transition-colors focus:outline-none ${
              isActive("/elevator-pitch-resume")
                ? "text-[#2B7FD0]"
                : "hover:text-[#2B7FD0]"
            }`}
          >
            My EVP Profile
          </Link>

          {/* Upgrade Plan (desktop) */}
          {status === "authenticated" &&
            isValid === false &&
            getUpgradePath() && (
              <Link
                href={getUpgradePath()!}
                className={`transition-colors focus:outline-none font-semibold ${
                  isActive(getUpgradePath()!)
                    ? "text-[#2B7FD0]"
                    : "text-[#2B7FD0] hover:opacity-80"
                }`}
              >
                Upgrade Plan
              </Link>
            )}

          {/* Blogs */}
          <Link
            href="/blogs"
            className={`transition-colors focus:outline-none ${
              isActive("/blogs") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
            }`}
          >
            Blogs
          </Link>

          {/* About Us moved out of More */}
          <Link
            href="/about-us"
            className={`transition-colors focus:outline-none ${
              isActive("/about-us") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
            }`}
          >
            About Us
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
              <DropdownMenuItem asChild>
                <Link href="/faq" className="w-full px-2 py-1.5 block">
                  FAQ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact-us" className="w-full px-2 py-1.5 block">
                  Contact Us
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More dropdown WITHOUT About Us */}
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
              <DropdownMenuItem asChild>
                <Link href="/careers" className="w-full px-2 py-1.5 block">
                  Careers
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/privacy-policy"
                  className="w-full px-2 py-1.5 block"
                >
                  Privacy Policy
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
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
              {/* Notifications Button with Unread Count Badge (desktop only) */}
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

              {/* DESKTOP Avatar */}
              <div className="hidden lg:block">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-10 w-10 cursor-pointer">
                      <AvatarImage src={userAvatar} alt="User Avatar" />
                      <AvatarFallback className="font-semibold">
                        {(userName && userName[0]) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <UserMenuContent />
                </DropdownMenu>
              </div>

              {/* MOBILE Avatar (to the LEFT of hamburger, outside the Sheet) */}
              <div className="lg:hidden">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-9 w-9 cursor-pointer">
                      <AvatarImage src={userAvatar} alt="User Avatar" />
                      <AvatarFallback className="font-semibold text-sm">
                        {(userName && userName[0]) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <UserMenuContent />
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
                Login/Sign-Up
              </Button>
            </Link>
          )}

          {/* Mobile Sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px]  p-0"
              onOpenAutoFocus={(e) => e.preventDefault()} // prevent mobile keyboard
            >
              <div className="h-full flex flex-col overflow-hidden">
                <Link
                  href="/"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-2 font-bold text-lg mb-6 px-4 pt-4"
                >
                  <Image
                    src={"/assets/evp-logo.jpg"}
                    alt="Logo"
                    width={500}
                    height={500}
                    className="h-[38px] w-[100px]"
                  />
                </Link>

                {/* Mobile-only search */}
                <div className="mb-6 md:hidden px-4">
                  <GlobalSearch />
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-24">
                  {status === "authenticated" && (
                    <div className="space-y-2 mb-6">
                      <Link
                        href="/notifications"
                        className="relative block"
                        onClick={() => setSheetOpen(false)}
                      >
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
                      <Link
                        href="/messages"
                        className="block"
                        onClick={() => setSheetOpen(false)}
                      >
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

                  {/* Mobile nav links */}
                  <nav className="grid gap-4 text-sm font-medium">
                    <Link
                      href="/"
                      onClick={() => setSheetOpen(false)}
                      className={`transition-colors focus:outline-none ${
                        isActive("/")
                          ? "text-[#2B7FD0]"
                          : "hover:text-[#2B7FD0]"
                      }`}
                    >
                      Home
                    </Link>
                    <Link
                      href="/alljobs"
                      onClick={() => setSheetOpen(false)}
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
                        onClick={() => setSheetOpen(false)}
                        className={`transition-colors focus:outline-none ${
                          isActive("/elevator-pitch-resume")
                            ? "text-[#2B7FD0]"
                            : "hover:text-[#2B7FD0]"
                        }`}
                      >
                        My EVP Profile
                      </Link>
                    )}

                    {/* Blogs */}
                    <Link
                      href="/blogs"
                      onClick={() => setSheetOpen(false)}
                      className={`transition-colors focus:outline-none ${
                        isActive("/blogs")
                          ? "text-[#2B7FD0]"
                          : "hover:text-[#2B7FD0]"
                      }`}
                    >
                      Blogs
                    </Link>

                    {/* Upgrade Plan (mobile) */}
                    {status === "authenticated" &&
                      isValid === false &&
                      getUpgradePath() && (
                        <Link
                          href={getUpgradePath()!}
                          onClick={() => setSheetOpen(false)}
                          className={`transition-colors focus:outline-none ${
                            isActive(getUpgradePath()!)
                              ? "text-[#2B7FD0]"
                              : "hover:text-[#2B7FD0]"
                          }`}
                        >
                          Upgrade Plan
                        </Link>
                      )}

                    {/* About Us */}
                    <Link
                      href="/about-us"
                      onClick={() => setSheetOpen(false)}
                      className={`transition-colors focus:outline-none ${
                        isActive("/about-us")
                          ? "text-[#2B7FD0]"
                          : "hover:text-[#2B7FD0]"
                      }`}
                    >
                      About Us
                    </Link>

                    {/* Help & Info */}
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">
                        Help & Info
                      </div>
                      <div className="pl-4 space-y-2">
                        <Link
                          href="/faq"
                          onClick={() => setSheetOpen(false)}
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
                          onClick={() => setSheetOpen(false)}
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

                    {/* More (without About Us) */}
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">More</div>
                      <div className="pl-4 space-y-2">
                        <Link
                          href="/careers"
                          onClick={() => setSheetOpen(false)}
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
                          onClick={() => setSheetOpen(false)}
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
                          onClick={() => setSheetOpen(false)}
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

                    {/* Auth button */}
                    {status === "authenticated" ? (
                      <Button
                        onClick={() => {
                          setSheetOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        variant="outline"
                        className="w-full mt-4"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    ) : (
                      <Link href="/login" onClick={() => setSheetOpen(false)}>
                        <Button className="w-full bg-blue-500 hover:bg-primary text-white mt-4">
                          Login/Sign-Up
                        </Button>
                      </Link>
                    )}
                  </nav>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Bottom Blue Scrolling Bar */}
      <ScrollingInfoBar />
    </div>
  );
}
