"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

// Type for individual payment data (updated to match API fields)
interface Payment {
  transactionId: string;
  createdAt: string;
  planTitle: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
}

// Type for pagination metadata
interface Meta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Type for API response (updated to reflect actual API structure)
interface ApiResponse {
  success: boolean;
  data: {
    _id: string;
    userId: string;
    amount: number;
    planId: {
      _id: string;
      title: string;
      price: number;
    };
    paymentStatus: string;
    transactionId: string;
    paymentMethod: string;
    planStatus: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }[];
  meta: Meta;
}

// Type for Pagination component props (adjust based on your Pagination component)
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  totalItems: number;
  itemsPerPage: number;
}

// Type for next-auth session (customize as needed)
interface CustomSession {
  user?: {
    id?: string;
  };
  accessToken?: string;
}

export function PaymentHistory() {
  const { data: session } = useSession() as { data: CustomSession | null };
  const token = session?.accessToken;
  const userId = session?.user?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<Meta>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get current page from URL query params, default to 1
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = 10; // Matches API limit=10

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!token || !userId) {
        setError("Please log in to view payment history.");
        return;
      }

      if (!process.env.NEXT_PUBLIC_BASE_URL) {
        setError("API base URL is not configured.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/payments/user/${userId}?page=${currentPage}&limit=${itemsPerPage}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized access. Please log in again.");
          } else if (response.status === 404) {
            throw new Error("No payment history found for this user.");
          }
          throw new Error(`Failed to fetch payment history: ${response.statusText}`);
        }

        const result: ApiResponse = await response.json();
        if (result.success) {
          // Transform API data to match Payment interface
          const transformedData: Payment[] = result.data.map((item) => ({
            transactionId: item.transactionId,
            createdAt: item.createdAt,
            planTitle: item.planId.title,
            amount: item.amount,
            paymentMethod: item.paymentMethod,
            paymentStatus: item.paymentStatus,
          }));
          setPaymentData(transformedData);
          setMeta(result.meta);
        } else {
          throw new Error("API returned unsuccessful response.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred while fetching payment history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentData();
  }, [token, userId, currentPage]);

  const handleDownload = async (transactionId: string) => {
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      setError("API base URL is not configured.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/payments/receipt/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download receipt.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${transactionId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download receipt.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Payment History</h2>

      {error && (
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          {!token && (
            <Button
              onClick={() => router.push("/login")}
              className="mt-4"
            >
              Log In
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : paymentData.length === 0 ? (
        <p className="text-center text-gray-600">No payment history available.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table aria-label="Payment history table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Transaction ID</TableHead>
                <TableHead scope="col">Date & Time</TableHead>
                <TableHead scope="col">Plan Name</TableHead>
                <TableHead scope="col">Amount Paid</TableHead>
                <TableHead scope="col">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentData.map((payment, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{payment.transactionId}</TableCell>
                  <TableCell>{format(new Date(payment.createdAt), "PPp")}</TableCell>
                  <TableCell>{payment.planTitle}</TableCell>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="link" 
                      className="text-blue-600" 
                      onClick={() => handleDownload(payment.transactionId)}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="px-6 py-4 flex justify-center">
          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            onPageChange={(page: number) => {
              const currentParams = new URLSearchParams(searchParams.toString());
              currentParams.set("page", page.toString());
              router.push(`?${currentParams.toString()}`);
            }}
            isLoading={isLoading}
            totalItems={meta.totalItems}
            itemsPerPage={meta.itemsPerPage}
          />
        </div>
      )}
    </div>
  );
}