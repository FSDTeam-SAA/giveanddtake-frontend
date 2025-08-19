"use client";

import { useState } from "react";
import CreateResumeForm from "./create-resume-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCompanyAccount,
  getMyResume,
  getRecruiterAccount,
  updateResume,
} from "@/lib/api-service";
import { useSession } from "next-auth/react";
import RecruiterElevator from "./recruiter-elevator";
import CompanyProfilePage from "./company-profile";
import CreateCompanyPage from "./create-company";
import { Card, CardContent } from "@/components/ui/card";
import MyResume from "./resume";
import UpdateResumeForm from "./update-resume-form";
import EditableRecruiterAccount from "./editable-recruiter-account";
import CreateRecruiterAccount from "./create-recruiter-account";
import { Skeleton } from "@/components/ui/skeleton";
import CreatedJobs from "./jobs";

export default function ElevatorPitchAndResume() {
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Resume query
  const {
    data: myresume,
    isLoading: resumeLoading,
    isFetching: resumeFetching,
  } = useQuery({
    queryKey: ["my-resume"],
    queryFn: getMyResume,
    select: (data) => data?.data,
    enabled: !!session?.user,
  });

  // Recruiter query
  const {
    data: recruiter,
    isLoading: recruiterLoading,
    isFetching: recruiterFetching,
  } = useQuery({
    queryKey: ["recruiter"],
    queryFn: () => getRecruiterAccount(session?.user?.id || ""),
    select: (data) => data?.data,
    enabled: !!session?.user?.role,
  });

  // Company query
  const {
    data: company,
    isLoading: companyLoading,
    isFetching: companyFetching,
  } = useQuery({
    queryKey: ["company-account", session?.user?.id],
    queryFn: () => getCompanyAccount(session?.user?.id || ""),
    select: (data) => data?.data,
    enabled: !!session?.user?.id,
  });

  const handleUpdate = async (data: FormData) => {
    try {
      await updateResume(data);
      queryClient.invalidateQueries({ queryKey: ["my-resume"] });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update resume:", error);
    }
  };

  // 🔹 Session loading skeleton
  if (status === "loading") {
    return (
      <section className="py-8 lg:py-20">
        <div className="container mx-auto lg:px-6 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // 🔹 Unauthenticated state
  // if (!session?.user) {
  //   return (
  //     <section className="py-8 lg:py-20">
  //       <div className="container mx-auto lg:px-6">
  //         <Card>
  //           <CardContent className="p-6">
  //             <h2 className="text-2xl font-bold mb-4">Welcome to Resume App</h2>
  //             <p>Please sign in to access your resume.</p>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </section>
  //   );
  // }

  // 🔹 Global loading skeleton while queries fetch
  if (resumeLoading || recruiterLoading || companyLoading) {
    return (
      <section className="py-8 lg:py-20">
        <div className="container mx-auto lg:px-6 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 lg:py-20">
      <div className="container mx-auto lg:px-6">
        {session?.user?.role === "candidate" ? (
          myresume?.resume ? (
            isEditing ? (
              <UpdateResumeForm
                resume={myresume}
                onCancel={() => setIsEditing(false)}
                onUpdate={handleUpdate}
              />
            ) : (
              <MyResume resume={myresume} onEdit={() => setIsEditing(true)} />
            )
          ) : (
            <CreateResumeForm />
          )
        ) : session?.user?.role === "recruiter" ? (
          recruiter ? (
            <div className="lg:space-y-16 space-y-6">
              <EditableRecruiterAccount recruiter={recruiter} />
              <CreatedJobs />
              <RecruiterElevator recruiter={recruiter} />
            </div>
          ) : (
            <CreateRecruiterAccount />
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
