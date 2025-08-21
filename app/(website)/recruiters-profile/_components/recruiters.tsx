"use client";

import type React from "react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Globe, Linkedin, Twitter, LinkIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface MydataProps {
  userId: string;
}

interface SocialLink {
  label: string;
  _id: string;
}

interface RecruiterData {
  _id: string;
  userId: string;
  bio: string;
  photo: string;
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

export default function Recruiters({ userId }: MydataProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [recruiterData, setRecruiterData] = useState<RecruiterData | null>(
    null
  );
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!recruiterData) {
    return <div>No recruiter data found.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
        {/* Profile Section */}
        <div className="col-span-4 space-y-4">
          <div>
            {recruiterData.photo && (
              <Image
                src={recruiterData.photo}
                alt={`${recruiterData.firstName} ${recruiterData.lastName}`}
                width={100}
                height={100}
                className="w-[170px] h-[170px] rounded-md"
              />
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
                  <a
                    key={link._id}
                    href={`#${link.label.toLowerCase()}`} // Replace with actual link if available
                    className="text-blue-500 hover:text-blue-700"
                    title={link.label}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>
          <div>
            <Button>Follow</Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="col-span-6 pt-24">
          <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-1">
            Contact Info
          </h2>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <p className="text-gray-700">
              <strong>Location:</strong> {recruiterData.country},{" "}
              {recruiterData.zipCode}
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong> {recruiterData.phoneNumber}
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong> {recruiterData.emailAddress}
            </p>
            <p className="text-gray-700">
              <strong>Website Link:</strong> Not provided
            </p>
            <p className="text-gray-700">
              <strong>Availability:</strong> Not specified
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-300 mt-6" />
      {/* About */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">About</h2>
        <div
          className="text-gray-700 mt-2"
          dangerouslySetInnerHTML={{ __html: recruiterData.bio }}
        />
      </div>

      {/* Skills */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">Skills</h2>
        <div className="flex space-x-2 mt-2">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            UX/UI Design
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Prototyping
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            User Testing
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Design Systems
          </button>
        </div>
      </div>

      {/* Experience */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">Experience</h2>
        <div className="mt-2">
          <p className="text-gray-700">
            <strong>Product Designer</strong>
          </p>
          <p className="text-gray-700">Jan 2015 - Present | 10+ years</p>
          <p className="text-gray-700">Various Startups, Remote</p>
        </div>
      </div>

      {/* Education */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">Education</h2>
        <div className="mt-2">
          <p className="text-gray-700">
            <strong>Bachelor in Design</strong>
          </p>
          <p className="text-gray-700">University of Yerevan</p>
          <p className="text-gray-700">Sep 2009 - Jun 2013 | 4 years</p>
        </div>
      </div>

      {/* Awards & Honours */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">Awards & Honours</h2>
        <div className="mt-2">
          <p className="text-gray-700">
            <strong>Best UX Design Award</strong>
          </p>
          <p className="text-gray-700">
            For outstanding user-centric design, 2023
          </p>
        </div>
      </div>
    </div>
  );
}
