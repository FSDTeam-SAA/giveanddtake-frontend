"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Globe, Linkedin, Twitter, LinkIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SocialLink {
  label: string;
  _id: string;
  url?: string; // Added optional URL field for social links
}

interface RecruiterData {
  _id: string;
  userId: string;
  bio: string;
  photo?: string;
  banner?: string; // Added banner to interface
  title: string;
  firstName: string;
  lastName: string;
  sureName: string;
  country: string;
  city: string;
  zipCode: string;
  emailAddress: string;
  phoneNumber: string;
  sLink: SocialLink[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface MydataProps {
  userId: string;
}

export default function Recruiters({ userId }: MydataProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [recruiterData, setRecruiterData] = useState<RecruiterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const iconMap: Record<string, React.ElementType> = {
    website: Globe,
    linkedin: Linkedin,
    twitter: Twitter,
    other: LinkIcon,
    upwork: LinkIcon,
  };

  useEffect(() => {
    const fetchRecruiterData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/recruiter/recruiter-account/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recruiter data");
        }

        const result = await response.json();
        if (result.success) {
          setRecruiterData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (token && userId) {
      fetchRecruiterData();
    }
  }, [token, userId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 animate-pulse">
        <div className="w-full h-48 bg-gray-200 rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mt-6">
          <div className="col-span-4 space-y-4">
            <div className="w-[170px] h-[170px] bg-gray-200 rounded-md"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="col-span-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-6 text-red-500">Error: {error}</div>;
  }

  if (!recruiterData) {
    return <div className="container mx-auto p-6">No recruiter data found.</div>;
  }

  return (
    <div className="container mx-auto px-6">
      {/* Banner */}
      <div className="relative w-full h-[300px]">
        <Image
          src={recruiterData.banner || "/placeholder-banner.jpg"} // Fallback banner
          alt={`${recruiterData.firstName} ${recruiterData.lastName} Banner`}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-10 gap-6 mt-[-60px] px-24">
        {/* Profile Section */}
        <div className="col-span-1 md:col-span-4 space-y-4">
          <div className="relative w-[170px] h-[170px]">
            {recruiterData.photo ? (
              <Image
                src={recruiterData.photo}
                alt={`${recruiterData.firstName} ${recruiterData.lastName}`}
                fill
                className="rounded-md object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-500">No Photo</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {recruiterData.firstName} {recruiterData.sureName}{" "}
              {recruiterData.lastName}
            </h1>
            <p className="text-lg text-gray-600">{recruiterData.title}</p>
            <div className="flex space-x-2 mt-2">
              {recruiterData.sLink.map((link) => {
                const Icon = iconMap[link.label.toLowerCase()] || iconMap.other;
                return (
                  <Link
                    key={link._id}
                    href={link.url || `#${link.label.toLowerCase()}`} // Use actual URL if available
                    className="text-blue-500 hover:text-blue-700 border border-[#9EC7DC] p-2 rounded transition-colors"
                    title={link.label}
                    aria-label={`Visit ${link.label} profile`}
                  >
                    <Icon size={20} />
                  </Link>
                );
              })}
            </div>
          </div>
          <div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
              aria-label={`Follow ${recruiterData.firstName} ${recruiterData.lastName}`}
            >
              Follow
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="col-span-1 md:col-span-6 pt-4 md:pt-24">
          <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-1">
            Contact Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <p className="text-gray-700">
              <strong>Location:</strong> {recruiterData.city}, {recruiterData.country},{" "}
              {recruiterData.zipCode}
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong> {recruiterData.phoneNumber}
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${recruiterData.emailAddress}`}
                className="text-blue-500 hover:underline"
              >
                {recruiterData.emailAddress}
              </a>
            </p>
            <p className="text-gray-700">
              <strong>Website:</strong>{" "}
              {recruiterData.sLink.find((link) => link.label.toLowerCase() === "website")?.url ? (
                <a
                  href={recruiterData.sLink.find((link) => link.label.toLowerCase() === "website")?.url}
                  className="text-blue-500 hover:underline"
                >
                  Visit Website
                </a>
              ) : (
                "Not provided"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 mt-6" />

      {/* About */}
      <section className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">About</h2>
        <div
          className="text-gray-700 mt-2 prose"
          dangerouslySetInnerHTML={{ __html: recruiterData.bio }}
        />
      </section>

      {/* Skills */}
      <section className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">Skills</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {["UX/UI Design", "Prototyping", "User Testing", "Design Systems"].map((skill) => (
            <span
              key={skill}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">Experience</h2>
        <div className="mt-2">
          <p className="text-gray-700 font-medium">Product Designer</p>
          <p className="text-gray-600">Various Startups, Remote</p>
          <p className="text-gray-600">Jan 2015 - Present | 10+ years</p>
        </div>
      </section>

      {/* Education */}
      <section className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">Education</h2>
        <div className="mt-2">
          <p className="text-gray-700 font-medium">Bachelor in Design</p>
          <p className="text-gray-600">University of Yerevan</p>
          <p className="text-gray-600">Sep 2009 - Jun 2013 | 4 years</p>
        </div>
      </section>

      {/* Awards & Honours */}
      <section className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">Awards & Honours</h2>
        <div className="mt-2">
          <p className="text-gray-700 font-medium">Best UX Design Award</p>
          <p className="text-gray-600">For outstanding user-centric design, 2023</p>
        </div>
      </section>
    </div>
  );
}