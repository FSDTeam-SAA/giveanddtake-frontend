"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function HowItWorksSection() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const router = useRouter();

  return (
    <section className="w-full py-10 md:py-16 bg-gray-50">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px] text-[#000000]">
          How It Works
        </h2>
        <div className="w-[180px] md:w-[240px] h-[4px] bg-primary rounded-[35px] mt-4"></div>

        {/* Cards grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {/* Candidates Card */}
          <Card className="flex flex-col items-center lg:p-6 text-center shadow-sm hover:shadow-md transition-shadow rounded-2xl h-auto min-h-[350px] overflow-hidden">
            <CardHeader className="pb-4">
              <Image
                src="/assets/user.png"
                alt="Candidates"
                width={83}
                height={83}
                className="h-[83px] w-[83px]"
                priority
              />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 space-y-3 w-full">
              <CardTitle className="text-xl font-semibold">
                Candidates
              </CardTitle>
              <ul className="text-gray-600 text-sm space-y-2 text-left pl-5 list-disc break-words leading-relaxed">
                <li>Gain an edge over millions of jobseekers</li>
                <li>Create your private Elevator Video Pitch© today</li>
                <li>Pitch the real you in 30 seconds</li>
                <li>Make a lasting impression from the first hello</li>
                <li>Share your private EVPitch© with each application</li>
                <li>
                  Manage your account online (or through your EVP app coming
                  soon!)
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Recruiters Card */}
          <Card className="flex flex-col items-center lg:p-6 text-center shadow-sm hover:shadow-md transition-shadow rounded-2xl h-auto min-h-[350px] overflow-hidden">
            <CardHeader className="pb-4">
              <Image
                src="/assets/explor.png"
                alt="Recruiters"
                width={83}
                height={83}
                className="h-[83px] w-[83px]"
              />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 space-y-3 w-full">
              <CardTitle className="text-xl font-semibold">
                Recruiters
              </CardTitle>
              <ul className="text-gray-600 text-sm space-y-2 text-left pl-5 list-disc break-words leading-relaxed">
                <li>Create a 60-seconds recruiters’ pitch</li>
                <li>Schedule job adverts</li>
                <li>View each applicant’s private Elevator Video Pitch©</li>
                <li>One-click feedback to applicants</li>
                <li>
                  Manage your account online (or through your EVP app coming
                  soon!)
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Companies Card */}
          <Card className="flex flex-col items-center lg:p-6 text-center shadow-sm hover:shadow-md transition-shadow rounded-2xl h-auto min-h-[350px] overflow-hidden">
            <CardHeader className="pb-4">
              <Image
                src="/assets/chair.png"
                alt="Companies"
                width={83}
                height={83}
                className="h-[83px] w-[83px]"
              />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1 space-y-3 w-full">
              <CardTitle className="text-xl font-semibold">Companies</CardTitle>
              <ul className="text-gray-600 text-sm space-y-2 text-left pl-5 list-disc break-words leading-relaxed">
                <li>
                  Amplify your corporate brand in a powerful 60-seconds Elevator
                  Video Pitch© today
                </li>
                <li>Hire strong talent for your business to thrive</li>
                <li>
                  Add multiple in-house recruiters to your corporate account
                </li>
                <li>
                  Directly screen each applicant’s private Elevator Video Pitch©
                  online
                </li>
                <li>
                  Manage your account online (or through your EVP app coming
                  soon!)
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
