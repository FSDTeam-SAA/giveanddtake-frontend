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
  ArrowRight,
  LogOut,
  LayoutDashboard,
  ChartNoAxesGantt,
  Video,
  UserPen,
  Settings,
  Bookmark,
  CreditCard,
} from "lucide-react";
import { ScrollingInfoBar } from "./scrolling-info-bar";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const pathname = usePathname();
  const [userAvatar, setUserAvatar] = useState("");
  const [userName, setUserName] = useState("");

  const userRole = session?.user?.role; // 'candidate', 'recruiter', 'company'

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
            setUserName(result.data.name || "CN");
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
              className="h-[38px] lg:h-[48px] w-[140px] lg:w-[180px]"
            />
          </Link>
        </div>

        {/* Middle Section: Navigation Links (hidden on small screens) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`transition-colors ${
              isActive("/") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/alljobs"
            className={`transition-colors ${
              isActive("/alljobs") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
            }`}
          >
            Jobs
          </Link>

          {token && (
            <Link
              href="/elevator-pitch-resume"
              className={`transition-colors ${
                isActive("/elevator-pitch-resume")
                  ? "text-[#2B7FD0]"
                  : "hover:text-[#2B7FD0]"
              }`}
            >
              Elevator Pitch & Resume
            </Link>
          )}

          <Link
            href="/blog"
            className={`transition-colors ${
              isActive("/blog") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
            }`}
          >
            Blog
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`h-auto p-0 text-sm font-medium transition-colors ${
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
                className={isActive("/faq") ? "text-[#2B7FD0]" : ""}
              >
                <Link href="/faq">FAQ</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={isActive("/support") ? "text-[#2B7FD0]" : ""}
              >
                <Link href="/support">Support</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={isActive("/contact-us") ? "text-[#2B7FD0]" : ""}
              >
                <Link href="/contact-us">Contact Us</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`h-auto p-0 text-sm font-medium transition-colors ${
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
                className={isActive("/about-us") ? "text-[#2B7FD0]" : ""}
              >
                <Link href="/about-us">About Us</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={isActive("/careers") ? "text-[#2B7FD0]" : ""}
              >
                <Link href="/careers">Careers</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={isActive("/privacy-policy") ? "text-[#2B7FD0]" : ""}
              >
                <Link href="/privacy-policy">Privacy Policy</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={isActive("/terms-condition") ? "text-[#2B7FD0]" : ""}
              >
                <Link href="/terms-condition">Terms and Conditions</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Section: Action Buttons & Avatar or Login */}
        <div className="flex items-center gap-2 md:gap-4">
          {status === "authenticated" ? (
            <>
              <Link href="/notifications">
                <Button
                  size="icon"
                  className="rounded-full bg-blue-500 text-white hover:bg-primary"
                >
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </Link>
              <Link href="/messages">
                <Button
                  size="icon"
                  className="rounded-full bg-blue-500 text-white hover:bg-primary"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="sr-only">Messages</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage
                      src={userAvatar || "/placeholder.svg?height=32&width=32"}
                      alt="User Avatar"
                    />
                    <AvatarFallback>{userName[0] || "CN"}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  {(userRole === "recruiter" || userRole === "company") && (
                    <>
                      {links.dashboard && (
                        <DropdownMenuItem
                          className={
                            isActive(links.dashboard) ? "text-[#2B7FD0]" : ""
                          }
                        >
                          <Link
                            href={links.dashboard}
                            className="flex items-center"
                          >
                            <LayoutDashboard className="mr-2 h-4 w-4" />{" "}
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {links.elevatorPitch && (
                        <DropdownMenuItem
                          className={
                            isActive(links.elevatorPitch)
                              ? "text-[#2B7FD0]"
                              : ""
                          }
                        >
                          <Link
                            href={links.elevatorPitch}
                            className="flex items-center"
                          >
                            <Video className="mr-2 h-4 w-4" /> Elevator Pitch
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {links.settings && (
                        <DropdownMenuItem
                          className={
                            isActive(links.settings) ? "text-[#2B7FD0]" : ""
                          }
                        >
                          <Link
                            href={links.settings}
                            className="flex items-center"
                          >
                            <Settings className="mr-2 h-4 w-4" /> Settings
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {/* ✅ My Plan menu item */}
                      <DropdownMenuItem>
                        <Link
                          href={
                            userRole === "recruiter"
                              ? "/recruiter-pricing"
                              : "/company-pricing"
                          }
                          className="flex items-center"
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> My Plan
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {userRole === "candidate" && (
                    <>
                      <DropdownMenuItem
                        className={
                          isActive(getProfileLink()) ? "text-[#2B7FD0]" : ""
                        }
                      >
                        <Link
                          href={getProfileLink()}
                          className="flex items-center"
                        >
                          <UserPen className="mr-2 h-4 w-4" /> Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={
                          isActive("/bookmarks") ? "text-[#2B7FD0]" : ""
                        }
                      >
                        <Link href="/bookmarks" className="flex items-center">
                          <Bookmark className="mr-2 h-4 w-4" /> Bookmarks
                        </Link>
                      </DropdownMenuItem>
                      {/* ✅ My Plan menu item */}
                      <DropdownMenuItem>
                        <Link
                          href="/user-pricing"
                          className="flex items-center"
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> My Plan
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
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
                href="#"
                className="flex items-center gap-2 font-bold text-lg mb-6"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-md" />
                YOUR LOGO
              </Link>
              <nav className="grid gap-4 text-sm font-medium">
                <Link
                  href="/"
                  className={`transition-colors ${
                    isActive("/") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/alljobs"
                  className={`transition-colors ${
                    isActive("/alljobs")
                      ? "text-[#2B7FD0]"
                      : "hover:text-[#2B7FD0]"
                  }`}
                >
                  All Jobs
                </Link>
                {(userRole === "candidate" || userRole === "recruiter") && (
                  <Link
                    href="/elevator-pitch-resume"
                    className={`transition-colors ${
                      isActive("/elevator-pitch-resume")
                        ? "text-[#2B7FD0]"
                        : "hover:text-[#2B7FD0]"
                    }`}
                  >
                    Elevator Pitch & Resume
                  </Link>
                )}
                <Link
                  href="/blog"
                  className={`transition-colors ${
                    isActive("/blog")
                      ? "text-[#2B7FD0]"
                      : "hover:text-[#2B7FD0]"
                  }`}
                >
                  Blog
                </Link>
                <Link
                  href="/faq"
                  className={`transition-colors ${
                    isActive("/faq") ? "text-[#2B7FD0]" : "hover:text-[#2B7FD0]"
                  }`}
                >
                  Help & Info
                </Link>
                <Link
                  href="/about-us"
                  className={`transition-colors ${
                    isActive("/about-us")
                      ? "text-[#2B7FD0]"
                      : "hover:text-[#2B7FD0]"
                  }`}
                >
                  More
                </Link>
                <Button className="w-full bg-blue-500 hover:bg-primary text-white">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
