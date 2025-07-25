"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
} from "lucide-react";
import { ScrollingInfoBar } from "./scrolling-info-bar";
import { useSession, signOut } from "next-auth/react";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="w-full">
      {/* Top Navbar */}
      <div className=" container flex h-16 items-center justify-between px-4 md:px-6 border-b">
        {/* Left Section: Logo */}
        <div className="flex items-center gap-4">
          <Link href="#" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-md" />
            YOUR LOGO
          </Link>
        </div>

        {/* Middle Section: Navigation Links (hidden on small screens) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link
            href="#"
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            Home
          </Link>
          <Link href="#" className="hover:text-blue-500 transition-colors">
            All Jobs
          </Link>
          <Link href="/elevator-pitch-resume" className="hover:text-blue-500 transition-colors">
            Elevator Pitch & Resume
          </Link>
          <Link href="#" className="hover:text-blue-500 transition-colors">
            Blog
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto p-0 text-sm font-medium hover:text-blue-500 transition-colors"
              >
                Help & Info <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>FAQ</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Contact Us</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto p-0 text-sm font-medium hover:text-blue-500 transition-colors"
              >
                More <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>About Us</DropdownMenuItem>
              <DropdownMenuItem>Careers</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Privacy Policy</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Section: Action Buttons & Avatar or Login */}
        <div className="flex items-center gap-2 md:gap-4">
          {status === "authenticated" ? (
            <>
              <Button
                size="icon"
                className="rounded-full bg-blue-500 text-white hover:bg-blue-600"
              >
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button
                size="icon"
                className="rounded-full bg-blue-500 text-white hover:bg-blue-600"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">Messages</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage
                      src={
                        session.user?.image ||
                        "/placeholder.svg?height=32&width=32"
                      }
                      alt="User Avatar"
                    />
                    <AvatarFallback>
                      {session.user?.name?.[0] || "CN"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
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
                  href="#"
                  className="hover:text-blue-500 transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="#"
                  className="hover:text-blue-500 transition-colors"
                >
                  All Jobs
                </Link>
                <Link
                  href="/elevator-pitch-resume"
                  className="hover:text-blue-500 transition-colors"
                >
                  Elevator Pitch & Resume
                </Link>
                <Link
                  href="#"
                  className="hover:text-blue-500 transition-colors"
                >
                  Blog
                </Link>
                <Link
                  href="#"
                  className="hover:text-blue-500 transition-colors"
                >
                  Help & Info
                </Link>
                <Link
                  href="#"
                  className="hover:text-blue-500 transition-colors"
                >
                  More
                </Link>
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bottom Blue Scrolling Bar */}
      <ScrollingInfoBar />
    </header>
  );
}
