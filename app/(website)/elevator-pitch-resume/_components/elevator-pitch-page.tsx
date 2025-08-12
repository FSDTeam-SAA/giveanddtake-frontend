"use client";

import React from "react";
import CreateResumeForm from "./create-resume-form";
import { useQuery } from "@tanstack/react-query";
import {
  getCompanyAccount,
  getMyResume,
  getRecruiterAccount,
} from "@/lib/api-service";
import MyResume from "./resume";
import { useSession } from "next-auth/react";
import RecruiterAccount from "./recruiter-account";
import CreatedJobs from "./jobs";
import RecruiterElevator from "./recruiter-elevator";
import CompanyProfilePage from "./company-profile";
import CreateCompanyPage from "./create-company";

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

  const { data: company } = useQuery({
    queryKey: ["company-account", session?.user?.id],
    queryFn: () => getCompanyAccount(session?.user?.id || ""),
    select: (data) => data?.data,
    enabled: !!session?.user?.id,
  });

  return (
    <section className="py-8 lg:py-20">
      <div className="container mx-auto lg:px-6">
        {session?.user?.role === "candidate" ? (
          myresume ? (
            <MyResume resume={myresume} />
          ) : (
            <CreateResumeForm />
          )
        ) : session?.user?.role === "recruiter" ? (
          recruiter ? (
            <div className="lg:space-y-16 space-y-6">
              <RecruiterAccount recruiter={recruiter} />
              <CreatedJobs />
              <RecruiterElevator recruiter={recruiter} />
            </div>
          ) : (
            <CreateResumeForm />
          )
        ) : Array.isArray(company?.companies) &&
          company.companies.length > 0 ? (
          <CompanyProfilePage userId={session?.user?.id} />
        ) : (
          <CreateCompanyPage />
        )}
      </div>
    </section>
  );
}
