"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import RecruiterTable from "./RecruiterTable";
import PendingEmployeeRequest from "./PendingEmployeeRequest";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmployeeSelector } from "@/components/company/employee-selector";

interface EmployeeData {
  _id: string;
  name: string;
  email: string;
  phoneNum: string;
  role: string;
  skills: string[];
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phoneNum: string;
  role: string;
  avatar?: { url: string };
}

interface RequestData {
  _id: string;
  userId: UserData;
  company: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    company: {
      _id: string;
      cname: string;
      industry: string;
      aboutUs: string;
      country: string;
      city: string;
    };
    employees: EmployeeData[];
    request: RequestData[];
    meta: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

interface RecruiterListPageProps {
  companyId: string;
}

export default function RecruiterListPage({
  companyId,
}: RecruiterListPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showRequests, setShowRequests] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const session = useSession();
  const userId = session.data?.user?.id;

  const token = session.data?.accessToken;

  const { data, isLoading, isError, error, isFetching } = useQuery<
    ApiResponse,
    Error
  >({
    queryKey: ["employees", companyId, currentPage],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/company-employess/skills/${companyId}?page=${currentPage}`
      );
      if (!res.ok) {
        throw new Error(
          res.status === 404 ? "Company not found" : "Failed to fetch employees"
        );
      }
      const response = (await res.json()) as ApiResponse;
      if (!response.success) {
        throw new Error(
          response.message || "API returned an unsuccessful response"
        );
      }
      return response;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // Delete Employee Mutation
  const deleteMutation = useMutation<DeleteResponse, Error, string>({
    mutationFn: async (employeeId: string) => {
      const companyRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/${companyId}`
      );
      if (!companyRes.ok) throw new Error("Failed to fetch company data");

      const companyData = await companyRes.json();
      const currentEmployeesId = companyData.data.companies[0].employeesId;

      const updatedEmployeesId = currentEmployeesId.filter(
        (id: string) => id !== employeeId
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/${companyId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeesId: updatedEmployeesId }),
        }
      );

      const response = await res.json();
      if (!res.ok || !response.success)
        throw new Error(response.message || "Failed to delete employee");
      return response;
    },
    onMutate: async (employeeId: string) => {
      await queryClient.cancelQueries({
        queryKey: ["employees", companyId, currentPage],
      });

      const previousData = queryClient.getQueryData<ApiResponse>([
        "employees",
        companyId,
        currentPage,
      ]);

      queryClient.setQueryData(
        ["employees", companyId, currentPage],
        (old: ApiResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              employees: old.data.employees.filter((e) => e._id !== employeeId),
            },
          };
        }
      );

      return { previousData };
    },
    onError: (err, employeeId, context) => {
      const ctx = context as { previousData?: ApiResponse } | undefined;
      queryClient.setQueryData(
        ["employees", companyId, currentPage],
        ctx?.previousData
      );
      console.error(
        "Error deleting employee:",
        err instanceof Error ? err.message : err
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", companyId, currentPage],
      });
    },
  });

  const handleDelete = (employeeId: string) =>
    deleteMutation.mutate(employeeId);

  // Pagination
  const handlePreviousPage = (page?: number) => {
    if (page) setCurrentPage(page);
    else if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < (data?.data?.meta?.totalPages || 1))
      setCurrentPage(currentPage + 1);
  };

  // Add Employees Mutation
  const addEmployeesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/add-employee-to-company`,
        {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
           },
          body: JSON.stringify({ companyId, employeeIds: selectedEmployees }),
        }
      );
      const response = await res.json();
      if (!res.ok || !response.success)
        throw new Error(response.message || "Failed to add employees");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees", companyId, currentPage],
      });
      setShowModal(false);
      setSelectedEmployees([]);
    },
    onError: (err: any) =>
      console.error("Error adding employees:", err.message),
  });

  const recruiters: EmployeeData[] = data?.data?.employees || [];
  const requests: RequestData[] = data?.data?.request || [];
  const totalPages = data?.data?.meta?.totalPages || 1;

  if (isLoading && !data)
    return <div className="p-6 container mx-auto">Loading...</div>;
  if (isError)
    return <div className="p-6 container mx-auto">Error: {error.message}</div>;

  return (
    <div className="p-6 container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4">
        <h1 className="text-2xl font-semibold mb-6 md:mb-0">Recruiter List</h1>
        <div className="flex gap-4">
          <Button onClick={() => setShowModal(true)}>Add recruiter</Button>
        </div>
      </div>

      {/* Requests Section */}
      <PendingEmployeeRequest
        companyId={companyId}
        requests={requests}
        setShowRequests={setShowRequests}
      />

      {/* Recruiters Table */}
      {!showRequests && (
        <RecruiterTable
          recruiters={recruiters}
          currentPage={currentPage}
          totalPages={totalPages}
          isFetching={isFetching}
          handleDelete={handleDelete}
          handlePreviousPage={handlePreviousPage}
          handleNextPage={handleNextPage}
          isDeletePending={deleteMutation.isPending}
        />
      )}

      {/* Add Recruiter Modal */}
      {showModal && (
        // Inside your RecruiterListPage component
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Recruiters</DialogTitle>
            </DialogHeader>

            <div className="mt-2">
              <EmployeeSelector
                selectedEmployees={selectedEmployees}
                onEmployeesChange={setSelectedEmployees}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addEmployeesMutation.mutate()}
                disabled={
                  selectedEmployees.length === 0 ||
                  addEmployeesMutation.isPending
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
