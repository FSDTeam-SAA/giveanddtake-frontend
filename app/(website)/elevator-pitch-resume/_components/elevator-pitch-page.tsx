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
import RecruiterAccount from "./recruiter-account";
import CreatedJobs from "./jobs";
import RecruiterElevator from "./recruiter-elevator";
import CompanyProfilePage from "./company-profile";
import CreateCompanyPage from "./create-company";
import { Card, CardContent } from "@/components/ui/card";
import MyResume from "./resume";
import UpdateResumeForm from "./update-resume-form";
import EditableRecruiterAccount from "./editable-recruiter-account";
import EditableCompanyProfile from "./editable-company-profile";

export default function ElevatorPitchAndResume() {
  const { data: session, status } = useSession(); // Added status to handle loading state
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: myresume } = useQuery({
    queryKey: ["my-resume"],
    queryFn: getMyResume,
    select: (data) => data?.data,
    enabled: !!session?.user, // Only fetch if user is authenticated
  });

  console.log("My resume here: ", myresume);

  const { data: recruiter } = useQuery({
    queryKey: ["recruiter"],
    queryFn: () => getRecruiterAccount(session?.user?.id || ""),
    select: (data) => data?.data,
    enabled: !!session?.user?.role,
  });

  const { data: company } = useQuery({
    queryKey: ["company-account", session?.user?.id],
    queryFn: () => getCompanyAccount(session?.user?.id || ""),
    select: (data) => data?.data,
    enabled: !!session?.user?.id,
  });

  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <section className="py-8 lg:py-20">
        <div className="container mx-auto lg:px-6">
          <Card>
            <CardContent className="p-6">
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  console.log("My resume here: ", myresume);
  console.log("Session user here: ", session?.user);

  const handleUpdate = async (data: FormData) => {
    console.log("Received form data in parent:", data);
    try {
      await updateResume(data);
      // Invalidate and refetch the resume data
      queryClient.invalidateQueries({ queryKey: ["my-resume"] });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update resume:", error);
      // You might want to show an error toast here
    }
  };

  // Handle unauthenticated state
  if (!session?.user) {
    return (
      <section className="py-8 lg:py-20">
        <div className="container mx-auto lg:px-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Welcome to Resume App</h2>
              <p>Please sign in to access your resume.</p>
              {/* You can add a sign-in button here */}
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
            <CreateResumeForm />
          )
        ) : Array.isArray(company?.companies) &&
          company.companies.length > 0 ? (
          <EditableCompanyProfile userId={session?.user?.id} />
        ) : (
          <CreateCompanyPage />
        )}
      </div>
    </section>
  );
}
