"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, MessageCircle, Menu, ChevronDown, ArrowRight, LogOut } from "lucide-react"
import { ScrollingInfoBar } from "./scrolling-info-bar"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  // console.log("Session data:", session)

  const userRole = session?.user?.role // 'candidate', 'recruiter', 'company'

  const getDashboardLink = () => {
    switch (userRole) {
      case "recruiter":
      case "company":
        return "/dashboard"
      case "candidate":
        return "/account"
      default:
        return "/dashboard"
    }
  }

  const getProfileLink = () => {
    return userRole === "candidate" ? "/account" : "/dashboard"
  }

  // Helper function to check if a link is active
  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <header className="w-full">
      {/* Top Navbar */}
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 border-b">
        {/* Left Section: Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-md" />
            YOUR LOGO
          </Link>
        </div>

        {/* Middle Section: Navigation Links (hidden on small screens) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link 
            href="/" 
            className={`transition-colors ${isActive('/') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
          >
            Home
          </Link>
          <Link 
            href="/alljobs" 
            className={`transition-colors ${isActive('/alljobs') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
          >
            All Jobs
          </Link>
          {userRole === "candidate" && (
            <Link 
              href="/elevator-pitch-resume" 
              className={`transition-colors ${isActive('/elevator-pitch-resume') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
            >
              Elevator Pitch & Resume
            </Link>
          )}
          <Link 
            href="/blog" 
            className={`transition-colors ${isActive('/blog') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
          >
            Blog
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`h-auto p-0 text-sm font-medium transition-colors ${pathname.startsWith('/help') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}>
                Help & Info <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem className={isActive('/faq') ? 'text-[#2B7FD0]' : ''}>
                <Link href="/faq">FAQ</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className={isActive('/support') ? 'text-[#2B7FD0]' : ''}>
                <Link href="/support">Support</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className={isActive('/contact-us') ? 'text-[#2B7FD0]' : ''}>
                <Link href="/contact-us">Contact Us</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`h-auto p-0 text-sm font-medium transition-colors ${pathname.startsWith('/more') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}>
                More <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem className={isActive('/about-us') ? 'text-[#2B7FD0]' : ''}>
                <Link href="/about-us">About Us</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className={isActive('/careers') ? 'text-[#2B7FD0]' : ''}>
                <Link href="/careers">Careers</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className={isActive('/privacy-policy') ? 'text-[#2B7FD0]' : ''}>
                <Link href="/privacy-policy">Privacy Policy</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className={isActive('/terms-condition') ? 'text-[#2B7FD0]' : ''}>
                <Link href="/terms-condition">Terms and Conditions</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Section: Action Buttons & Avatar or Login */}
        <div className="flex items-center gap-2 md:gap-4">
          {status === "authenticated" ? (
            <>
              <Button size="icon" className="rounded-full bg-blue-500 text-white hover:bg-blue-600">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button size="icon" className="rounded-full bg-blue-500 text-white hover:bg-blue-600">
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">Messages</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage
                      src={session.user?.image || "/placeholder.svg?height=32&width=32" || "/placeholder.svg"}
                      alt="User Avatar"
                    />
                    <AvatarFallback>{session.user?.name?.[0] || "CN"}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(userRole === "recruiter" || userRole === "company") && (
                    <DropdownMenuItem className={isActive(getDashboardLink()) ? 'text-[#2B7FD0]' : ''}>
                      <Link href={getDashboardLink()}>Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  {userRole === "candidate" && (
                    <DropdownMenuItem className={isActive(getProfileLink()) ? 'text-[#2B7FD0]' : ''}>
                      <Link href={getProfileLink()} className="cursor-pointer">Profile</Link>
                    </DropdownMenuItem>
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
              <Button className={`bg-blue-500 hover:bg-blue-600 text-white ${isActive('/login') ? 'bg-[#2B7FD0]' : ''}`}>
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
              <Link href="#" className="flex items-center gap-2 font-bold text-lg mb-6">
                <div className="w-8 h-8 bg-blue-500 rounded-md" />
                YOUR LOGO
              </Link>
              <nav className="grid gap-4 text-sm font-medium">
                <Link 
                  href="/" 
                  className={`transition-colors ${isActive('/') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
                >
                  Home
                </Link>
                <Link 
                  href="/alljobs" 
                  className={`transition-colors ${isActive('/alljobs') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
                >
                  All Jobs
                </Link>
                {userRole === "candidate" && (
                  <Link 
                    href="/elevator-pitch-resume" 
                    className={`transition-colors ${isActive('/elevator-pitch-resume') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
                  >
                    Elevator Pitch & Resume
                  </Link>
                )}
                <Link 
                  href="/blog" 
                  className={`transition-colors ${isActive('/blog') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
                >
                  Blog
                </Link>
                <Link 
                  href="/faq" 
                  className={`transition-colors ${isActive('/faq') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
                >
                  Help & Info
                </Link>
                <Link 
                  href="/about-us" 
                  className={`transition-colors ${isActive('/about-us') ? 'text-[#2B7FD0]' : 'hover:text-[#2B7FD0]'}`}
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
  )
}