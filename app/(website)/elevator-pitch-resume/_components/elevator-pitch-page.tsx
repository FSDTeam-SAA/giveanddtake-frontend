"use client";

import Link from "next/link";
import React from "react";
import CreateResumeForm from "./create-resume-form";
import { useQuery } from "@tanstack/react-query";
import { getMyResume, getRecruiterAccount } from "@/lib/api-service";
import MyResume from "./resume";
import { useSession } from "next-auth/react";
import RecruiterAccount from "./recruiter-account";
import CreatedJobs from "./jobs";
import RecruiterElevator from "./recruiter-elevator";

export default function ElevatorPitchAndResume() {
  const { data: session } = useSession();

  const { data: myresume } = useQuery({
    queryKey: ["my-resume"],
    queryFn: getMyResume,
    select: (data) => data?.data,
  });

  console.log("My resume here: ", myresume);

  const { data: recruiter } = useQuery({
    queryKey: ["recruiter"],
    queryFn: () => getRecruiterAccount(session?.user?.id || ""),
    select: (data) => data?.data,
    enabled: !!session?.user?.id,
  });

  return (
    <section className="py-8 lg:py-20">
      {session?.user?.role === "candidate" ? (
        <div className="container mx-auto lg:px-6">
          {!myresume ? (
            <div className="">
              {session?.user?.role === "candidate" ? (
                <div>
                  <div className="flex justify-center items-center relative lg:mb-12">
                    <div className="flex items-center">
                      <h2 className="text-5xl font-bold text-center">
                        Create Your Elevator Pitch & Resume
                      </h2>
                      <Link
                        href="/"
                        className="text-v0-blue-500 absolute top-1/2 right-0 -translate-y-1/2"
                      >
                        Skip
                      </Link>
                    </div>
                  </div>
                  <CreateResumeForm />
                </div>
              ) : (
                <h2>Create Your Elevator Pitch form for Recruiter</h2>
              )}
            </div>
          ) : session?.user?.role === "candidate" ? (
            <MyResume resume={myresume} />
          ) : (
            <div className="lg:space-y-16 space-y-6">
              <RecruiterAccount recruiter={recruiter} />
              <CreatedJobs />
              <RecruiterElevator recruiter={recruiter} />
            </div>
          )}
        </div>
      ) : (
        <div className="container mx-auto lg:px-6">
          {!myresume || !recruiter ? (
            <div className="">
              {session?.user?.role === "candidate" ? (
                <div>
                  <div className="flex justify-center items-center relative lg:mb-12">
                    <div className="flex items-center">
                      <h2 className="text-5xl font-bold text-center">
                        Create Your Elevator Pitch & Resume
                      </h2>
                      <Link
                        href="/"
                        className="text-v0-blue-500 absolute top-1/2 right-0 -translate-y-1/2"
                      >
                        Skip
                      </Link>
                    </div>
                  </div>
                  <CreateResumeForm />
                </div>
              ) : (
                <h2>Create Your Elevator Pitch form for Recruiter</h2>
              )}
            </div>
          ) : session?.user?.role === "candidate" ? (
            <MyResume resume={myresume} />
          ) : (
            <div className="lg:space-y-16 space-y-6">
              <RecruiterAccount recruiter={recruiter} />
              <CreatedJobs />
              <RecruiterElevator recruiter={recruiter} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
