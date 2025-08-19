"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Trash } from "lucide-react";

// Interface for employee data based on API response
interface EmployeeData {
  _id: string;
  name: string;
  email: string;
  phoneNum: string;
  role: string;
  skills: string[];
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

function RecruiterListPage({ companyId }: RecruiterListPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Fetch employees with pagination
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
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2, // Retry failed requests up to 2 times
  });

  // Mutation for deleting an employee
  const deleteMutation = useMutation<DeleteResponse, Error, string>({
    mutationFn: async (employeeId: string) => {
      // Fetch the current company data to get the existing employeesId array
      const companyRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/${companyId}`
      );
      if (!companyRes.ok) {
        throw new Error("Failed to fetch company data");
      }
      const companyData = await companyRes.json();
      const currentEmployeesId = companyData.data.companies[0].employeesId;

      // Filter out the employeeId to be deleted
      const updatedEmployeesId = currentEmployeesId.filter(
        (id: string) => id !== employeeId
      );

      // Send PUT request to update the employeesId array
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/company/${companyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeesId: updatedEmployeesId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete employee");
      }

      const response = (await res.json()) as DeleteResponse;
      if (!response.success) {
        throw new Error(response.message || "Failed to delete employee");
      }
      return response;
    },
    onMutate: async (employeeId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["employees", companyId, currentPage],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        "employees",
        companyId,
        currentPage,
      ]);

      // Optimistically update the employees list
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

      // Return context with the previous data for rollback on error
      return { previousData };
    },
    onError: (err, employeeId, context) => {
      // Rollback to the previous data on error
      queryClient.setQueryData(
        ["employees", companyId, currentPage],
        context?.previousData
      );
      console.error("Error deleting employee:", err.message);
    },
    onSuccess: () => {
      // Invalidate the query to refetch the updated data
      queryClient.invalidateQueries({
        queryKey: ["employees", companyId, currentPage],
      });
    },
  });

  // Handle delete button click
  const handleDelete = (employeeId: string) => {
    deleteMutation.mutate(employeeId);
  };

  // Map API data to table structure
  const recruiters: EmployeeData[] = data?.data?.employees || [];
  const totalPages = data?.data?.meta?.totalPages || 1;

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (isLoading && !data) {
    return <div className="p-6 container mx-auto">Loading...</div>;
  }

  if (isError) {
    return <div className="p-6 container mx-auto">Error: {error.message}</div>;
  }

  return (
    <div className="p-6 container mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Recruiter List</h1>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-medium text-gray-700">
                Recruiter Name
              </TableHead>
              <TableHead className="font-medium text-gray-700">Role</TableHead>
              <TableHead className="font-medium text-gray-700">
                Phone Number
              </TableHead>
              <TableHead className="font-medium text-gray-700">
                Total Skills
              </TableHead>
              <TableHead className="font-medium text-gray-700">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recruiters.map((recruiter) => (
              <TableRow key={recruiter._id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src="/placeholder.svg"
                        alt={recruiter.name}
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                        {recruiter.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">
                      {recruiter.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-opacity-80"
                  >
                    {recruiter.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {recruiter.phoneNum}
                </TableCell>
                <TableCell className="text-gray-600">
                  {recruiter.skills.length}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
                    onClick={() => handleDelete(recruiter._id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-transparent"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant="outline"
              size="sm"
              className={`h-8 w-8 p-0 ${
                currentPage === page
                  ? "bg-primary text-white border-blue-600 hover:bg-blue-700"
                  : "bg-transparent"
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-transparent"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {isFetching && (
          <div className="text-center text-gray-500 pb-4">Updating list...</div>
        )}
      </div>
    </div>
  );
}

export default RecruiterListPage;
