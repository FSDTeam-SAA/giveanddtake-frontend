"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

// Mock data - replace with actual API call
const paymentData = [
  {
    transactionId: "TXN23007891",
    dateTime: "2025-06-20 10:45 AM",
    planName: "Resume Highlight",
    amountPaid: 150,
    paymentMethod: "PayPal",
    status: "Successful",
  },
  // Add more mock data as needed
]

export function PaymentHistory() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Payment History</h2>

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
    </div>
  )
}
