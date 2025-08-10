"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";

// Type for individual payment data
interface Payment {
  transactionId: string;
  dateTime: string;
  planName: string;
  amountPaid: number;
  paymentMethod: string;
  status: string;
}

// Type for pagination metadata
interface Meta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Type for API response
interface ApiResponse {
  success: boolean;
  data: Payment[];
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
          throw new Error("Failed to fetch payment history.");
        }

        const result: ApiResponse = await response.json();
        if (result.success) {
          setPaymentData(result.data);
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Payment History</h2>

      {isLoading && <p className="text-center">Loading...</p>}
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
      {!isLoading && !error && paymentData.length === 0 && (
        <p className="text-center text-gray-600">No payment history available.</p>
      )}

      {paymentData.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Plan Name</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentData.map((payment, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{payment.transactionId}</TableCell>
                  <TableCell>{payment.dateTime}</TableCell>
                  <TableCell>{payment.planName}</TableCell>
                  <TableCell>{payment.amountPaid}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell className="text-green-600">{payment.status}</TableCell>
                  <TableCell>
                    <Button variant="link" className="text-blue-600">
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