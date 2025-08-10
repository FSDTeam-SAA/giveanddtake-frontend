"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use } from "react";

export function Footer() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const router = useRouter();

  const handleCreateAccountClick = () => {
    if (!token) {
      router.push("/login");
    } else {
      router.push("/elevator-pitch-resume");
    }
  };
  const handleCreateRecruiterAccountClick = () => {
    if (!token) {
      router.push("/login");
    } else {
      router.push("/recruiter-dashboard");
    }
  };
  const handleCreateCompanyAccountClick = () => {
    if (!token) {
      router.push("/login");
    } else {
      router.push("/create-company");
    }
  };
  return (
    <footer className="bg-v0-blue-500 text-white py-12 md:py-16 lg:py-20">
      <div className="container px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Company Info */}
        <div className="flex flex-col gap-4">
          <Link href="#" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-white rounded-md" />
            YOUR LOGO
          </Link>
          <p className="text-sm text-white/80">
            Connecting talent with opportunities and businesses with clients,
            with one pitch!
          </p>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <MapPin className="h-4 w-4" />
            <span>Linienstraße 120, 10115 Berlin</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Mail className="h-4 w-4" />
            <span>bz@mail.com</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Phone className="h-4 w-4" />
            <span>+1234 567 889</span>
          </div>
        </div>

        {/* Column 2: For Candidates */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">For Candidates</h3>
          <Button
            onClick={handleCreateAccountClick}
            variant="secondary"
            className="bg-white text-v0-blue-500 hover:bg-gray-100 w-fit"
          >
            Create Elevator Pitch
          </Button>
          <nav className="grid gap-2 text-sm">
            <Link href="/alljobs" className="text-white/80 hover:underline">
              Browse Jobs
            </Link>

            <Link
              href="/bookmarks" // Required by Next.js type definitions
              onClick={(e) => {
                e.preventDefault(); // stop default Link navigation
                if (!token) {
                  router.push("/login");
                } else {
                  router.push("/bookmarks");
                }
              }}
              className="text-white/80 hover:underline"
            >
              Saved Jobs
            </Link>
            <Link href="/alljobs" className="text-white/80 hover:underline">
              Apply for Jobs
            </Link>
            <Link
              href="#candidates-pricing"
              className="text-white/80 hover:underline"
            >
              Plan & Pricing
            </Link>
          </nav>
        </div>

        {/* Column 3: For Recruiter */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">For Recruiter</h3>
          <Button
            onClick={handleCreateRecruiterAccountClick}
            variant="secondary"
            className="bg-white text-v0-blue-500 hover:bg-gray-100 w-fit"
          >
            Create Elevator Pitch
          </Button>
          <nav className="grid gap-2 text-sm">
            <Link
              href="/add-job" // Required by Next.js type definitions
              onClick={(e) => {
                e.preventDefault(); // stop default Link navigation
                if (!token) {
                  router.push("/login");
                } else {
                  router.push("/add-job");
                }
              }}
              className="text-white/80 hover:underline"
            >
              Post a Job
            </Link>
            <Link
              href="/recruiter-dashboard" // Required by Next.js type definitions
              onClick={(e) => {
                e.preventDefault(); // stop default Link navigation
                if (!token) {
                  router.push("/login");
                } else {
                  router.push("/recruiter-dashboard");
                }
              }}
              className="text-white/80 hover:underline"
            >
              Employer Dashboard
            </Link>
            <Link href="#" className="text-white/80 hover:underline">
              Company Dashboard
            </Link>
          </nav>
        </div>

        {/* Column 4: For Company */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">For Company</h3>
          <Button
            onClick={handleCreateCompanyAccountClick}
            variant="secondary"
            className="bg-white text-v0-blue-500 hover:bg-gray-100 w-fit"
          >
            Create Elevator Pitch
          </Button>
          <nav className="grid gap-2 text-sm">
            <Link
              href="/create-company" // Required by Next.js type definitions
              onClick={(e) => {
                e.preventDefault(); // stop default Link navigation
                if (!token) {
                  router.push("/login");
                } else {
                  router.push("/create-company");
                }
              }}
              className="text-white/80 hover:underline"
            >
              Post a Job
            </Link>
            <Link href="#" className="text-white/80 hover:underline">
              Pitch services and events
            </Link>
            <Link 
               href="/company-profile" // Required by Next.js type definitions
              onClick={(e) => {
                e.preventDefault(); // stop default Link navigation
                if (!token) {
                  router.push("/login");
                } else {
                  router.push("/company-profile");
                }
              }}
            className="text-white/80 hover:underline">
              Company Dashboard
            </Link>
          </nav>
        </div>
      </div>
      <div className="container px-4 md:px-6 mt-12 pt-8 border-t border-white/20 text-center text-sm text-white/60">
        <p>&copy; 2025 Company_name All rights reserved.</p>
      </div>
    </footer>
  );
}
