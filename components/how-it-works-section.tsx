"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export function HowItWorksSection() {
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

  return (
    <section className="w-full py-10 md:py-16 bg-gray-50">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px] text-[#000000]">
          How It Works
        </h2>
        <div className="w-[180px] md:w-[240px] h-[4px] bg-primary rounded-[35px] mt-4"></div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {/* Candidates Card */}
          <Card
            className="flex flex-col items-center lg:p-6 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer h-[350px] w-full rounded-2xl" // For circle: use rounded-full and equal width & height
            onClick={handleCreateAccountClick}
          >
            <CardHeader className="pb-4">
              <Image
                src="/assets/user.png"
                alt="Candidates"
                width={1000}
                height={1000}
                className="h-[83px] w-[83px]"
              />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 space-y-2">
              <CardTitle className="text-xl font-semibold">
                Candidates
              </CardTitle>
              <ul className="text-gray-500 text-sm space-y-1 text-left list-disc list-inside">
                <li>
                  Gain an edge over 220 million jobseekers, create your elevator
                  video pitch today!
                </li>
                <li>Let employers meet the real you in 30 seconds</li>
                <li>Make a lasting impression from the first hello!</li>
                <li>Apply for jobs and edit your profile with the EVP app</li>
              </ul>
            </CardContent>
          </Card>

          {/* Recruiters Card */}
          <Card className="flex flex-col items-center lg:p-6 text-center shadow-sm hover:shadow-md transition-shadow h-[350px] w-full rounded-2xl">
            <CardHeader className="pb-4">
              <Image
                src="/assets/explor.png"
                alt="Recruiters"
                width={1000}
                height={1000}
                className="h-[83px] w-[83px]"
              />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 space-y-2">
              <CardTitle className="text-xl font-semibold">
                Recruiters
              </CardTitle>
              <ul className="text-gray-500 text-sm space-y-1 text-left list-disc list-inside">
                <li>Post job adverts</li>
                <li>View job applicant elevator pitches</li>
                <li>Screen applicants’ elevator pitches in 30 seconds</li>
                <li>Schedule job adverts</li>
                <li>Click to feedback to job applicants</li>
                <li>Post jobs with the EVP app</li>
              </ul>
            </CardContent>
          </Card>

          {/* Company Card */}
          <Card className="flex flex-col items-center lg:p-6 text-center shadow-sm hover:shadow-md transition-shadow h-[350px] w-full rounded-2xl">
            <CardHeader className="pb-4">
              <Image
                src="/assets/chair.png"
                alt="Company"
                width={1000}
                height={1000}
                className="h-[83px] w-[83px]"
              />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 space-y-2">
              <CardTitle className="text-xl font-semibold">Companies</CardTitle>
              <ul className="text-gray-500 text-sm space-y-1 text-left list-disc list-inside">
                <li>
                  Amplify your company brand with a powerful elevator pitch
                </li>
                <li>Directly screen experienced candidates online</li>
                <li>Hire strong talent for your business to thrive</li>
                <li>Listen to a pool of powerful job candidates on EVP</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
