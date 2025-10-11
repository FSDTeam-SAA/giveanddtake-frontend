"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { format, addMonths, addYears } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { jsPDF } from "jspdf"; // npm i jspdf

// Type for individual payment data (updated to match API fields)
interface Payment {
  transactionId: string;
  createdAt: string;
  updatedAt: string;
  planTitle: string;
  planValid: string; // "monthly" | "yearly"
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
      valid?: string; // monthly | yearly
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
          throw new Error(
            `Failed to fetch payment history: ${response.statusText}`
          );
        }

        const result: ApiResponse = await response.json();
        if (result.success) {
          // Transform API data to match Payment interface
          const transformedData: Payment[] = result.data.map((item) => ({
            transactionId: item.transactionId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            planTitle: item.planId.title,
            planValid: item.planId.valid || "monthly",
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
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching payment history."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentData();
  }, [token, userId, currentPage]);

  // compute valid till date based on updatedAt + plan validity
  const computeValidTill = (updatedAt: string, valid: string) => {
    const base = new Date(updatedAt);
    if (valid === "yearly") return addYears(base, 1);
    // default monthly
    return addMonths(base, 1);
  };

  // generate simple receipt PDF using jsPDF
  const generateReceipt = (payment: Payment) => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "A4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = 50;

      // Primary color
      const primary = "#4B98DE";

      // Header: colored band with title and optional logo box
      doc.setFillColor(primary);
      doc.rect(0, 0, pageWidth, 70, "F");

      // Company name on header (white)
      doc.setTextColor("#ffffff");
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Elevator Video Pitch©", margin, 44);

      // Receipt title on right side of header
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("RECEIPT", pageWidth - margin, 44, { align: "right" });

      y = 90;

      // Company tagline and contact info (left side)
      doc.setTextColor("#333333");
      doc.setFontSize(10);
      doc.text(
        "Connecting talent with opportunities and businesses with clients,",
        margin,
        y
      );
      doc.text("with one pitch!", margin, y + 14);
      doc.text("124 City Road, London EC1V 2NX", margin, y + 32);
      doc.text("info@evpitch.com", margin, y + 46);
      doc.text("+44 0203 954 2530", margin, y + 60);

      // Right: transaction details box
      const boxWidth = 220;
      const boxX = pageWidth - margin - boxWidth;
      const boxY = y - 8;
      const boxH = 80;
      doc.setDrawColor(200);
      doc.roundedRect(boxX, boxY, boxWidth, boxH, 6, 6);

      doc.setFontSize(10);
      doc.text(
        `Transaction ID: ${payment.transactionId}`,
        boxX + 10,
        boxY + 18
      );
      doc.text(`Method: ${payment.paymentMethod}`, boxX + 10, boxY + 32);
      doc.text(`Status: ${payment.paymentStatus}`, boxX + 10, boxY + 46);

      y += 110; // Added extra vertical spacing before the table

      // Table header background
      const tableX = margin;
      const tableWidth = pageWidth - margin * 2;
      const thHeight = 28;
      doc.setFillColor(primary);
      doc.rect(tableX, y, tableWidth, thHeight, "F");

      // Table header text (white)
      doc.setTextColor("#ffffff");
      doc.setFontSize(11);
      doc.text("Description", tableX + 12, y + 19);
      doc.text("Amount (USD)", tableX + tableWidth - 12, y + 19, {
        align: "right",
      });

      // Add a small gap below the header bar
      y += thHeight + 14;

      // Table body
      doc.setTextColor("#333333");
      doc.setFontSize(10);
      const descX = tableX + 12;
      const amtX = tableX + tableWidth - 12;
      doc.text(`${payment.planTitle} (${payment.planValid})`, descX, y);
      doc.text(`$${payment.amount.toFixed(2)}`, amtX, y, { align: "right" });
      y += 22;

      // Divider line
      doc.setDrawColor(220);
      doc.line(tableX, y, tableX + tableWidth, y);
      y += 16;

      // Totals area (right aligned)
      const totalsX = tableX + tableWidth - 12;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Total:", totalsX - 80, y, { align: "right" });
      doc.text(`$${payment.amount.toFixed(2)}`, totalsX, y, { align: "right" });
      y += 28;

      // Dates and validity
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Created At: ${format(new Date(payment.createdAt), "PPp")}`,
        margin,
        y
      );
      y += 14;
      doc.text(
        `Updated At: ${format(new Date(payment.updatedAt), "PPp")}`,
        margin,
        y
      );
      y += 14;
      const validTill = computeValidTill(payment.updatedAt, payment.planValid);
      doc.text(`Valid Till: ${format(validTill, "PPP")}`, margin, y);
      y += 28;

      // Footer note and signature line
      doc.setDrawColor(200);
      doc.line(margin, y, margin + 200, y);
      doc.setFontSize(10);
      doc.text("Authorized Signature", margin, y + 14);

      doc.setFontSize(9);
      doc.setTextColor("#666666");
      doc.text(
        "Thank you for your purchase! If you have any questions, contact support@evpitch.com.",
        margin,
        y + 40
      );

      const filename = `receipt_${payment.transactionId}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error("Failed to generate receipt", e);
      alert(
        "Could not generate receipt. Make sure jspdf is installed (npm i jspdf)."
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Payment History</h2>

      {error && (
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          {!token && (
            <Button onClick={() => router.push("/login")} className="mt-4">
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
        <p className="text-center text-gray-600">
          No payment history available.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table aria-label="Payment history table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Transaction ID</TableHead>
                <TableHead scope="col">Date & Time</TableHead>
                <TableHead scope="col">Plan Name</TableHead>
                <TableHead scope="col">Valid Till</TableHead>
                <TableHead scope="col">Amount Paid</TableHead>
                <TableHead scope="col">Method</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentData.map((payment, index) => {
                const validTill = computeValidTill(
                  payment.updatedAt,
                  payment.planValid
                );
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {payment.transactionId}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.updatedAt), "PPp")}
                    </TableCell>
                    <TableCell>{payment.planTitle}</TableCell>
                    <TableCell>{format(validTill, "PPP")}</TableCell>
                    <TableCell>${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell className="capitalize">
                      {payment.paymentStatus}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => generateReceipt(payment)}
                      >
                        Download Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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
              const currentParams = new URLSearchParams(
                searchParams.toString()
              );
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
