// "use client"

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Label } from "@/components/ui/label"
// import { useMutation } from "@tanstack/react-query"
// import { useState } from "react"

// interface PaymentMethodModalProps {
//   isOpen: boolean
//   price: string 
//   onClose: () => void
// }

// interface PayPalOrderResponse {
//   success: boolean
//   message: string
//   orderId: string
//   links: Array<{
//     href: string
//     rel: string
//     method: string
//   }>
// }

// async function createPayPalOrder(amount: string): Promise<PayPalOrderResponse> {
//   const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/create-order`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ amount }),
//   })

//   if (!response.ok) {
//     throw new Error("Failed to create PayPal order")
//   }

//   return response.json()
// }

// export function PaymentMethodModal({ isOpen, onClose, price }: PaymentMethodModalProps) {
//   const [paymentMethod, setPaymentMethod] = useState("paypal")

//   const mutation = useMutation({
//     mutationFn: createPayPalOrder,
//     onSuccess: (data) => {
    
//     },
//     onError: (error) => {
//       console.error("Error creating PayPal order:", error)
//       // You might want to show an error message to the user here
//     },
//   })

//   const handlePayNow = () => {
//     if (paymentMethod === "paypal") {
//       mutation.mutate(price)
//     }
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[425px] p-6">
//         <DialogHeader>
//           <DialogTitle className="text-2xl font-bold text-gray-900">Select Payment Method</DialogTitle>
//           <p>${price}</p>
//           <DialogDescription className="sr-only">Choose your preferred payment method.</DialogDescription>
//         </DialogHeader>
//         <div className="grid gap-4 py-4">
//           <RadioGroup 
//             value={paymentMethod} 
//             onValueChange={setPaymentMethod}
//             className="grid gap-2"
//           >
//             <div className="flex items-center justify-between rounded-md border p-4">
//               <div className="flex items-center gap-3">
//                 <img src="/placeholder.svg?height=24&width=24" alt="PayPal" className="h-6 w-6" />
//                 <Label htmlFor="paypal" className="text-base font-medium text-gray-900">
//                   PayPal
//                 </Label>
//               </div>
//               <RadioGroupItem value="paypal" id="paypal" />
//             </div>
//           </RadioGroup>
//         </div>
//         <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
//           <Button 
//             className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90" 
//             onClick={handlePayNow}
//             disabled={mutation.isPending}
//           >
//             {mutation.isPending ? "Processing..." : "Pay Now"}
//           </Button>
//           <p className="text-center text-sm text-gray-500 mt-2">Other Payment Methods Coming Soon!</p>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }


// "use client"

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Label } from "@/components/ui/label"
// import { useMutation } from "@tanstack/react-query"
// import { useState } from "react"
// import { useSession } from "next-auth/react"
// import PayPalCheckout from "./PaypalcheckoutFrom"

// interface PaymentMethodModalProps {
//   isOpen: boolean
//   price: string
//   bookingId?: string
//   onClose: () => void
// }

// interface PayPalOrderResponse {
//   success: boolean
//   message: string
//   orderId: string // PayPal order ID
//   bookingId?: string // Your internal booking ID
// }

// async function createPayPalOrder(amount: string, bookingId?: string): Promise<PayPalOrderResponse> {
//   const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/create-order`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ amount, bookingId }),
//   })

//   if (!response.ok) {
//     throw new Error("Failed to create PayPal order")
//   }

//   return response.json()
// }

// export function PaymentMethodModal({ isOpen, onClose, price, bookingId }: PaymentMethodModalProps) {
//   const [paymentMethod, setPaymentMethod] = useState("paypal")
//   const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
//   const [paypalOrderId, setPaypalOrderId] = useState("")
//   const session = useSession()
//   const userId = session?.data?.user?.id || ""

//   const mutation = useMutation({
//     mutationFn: () => createPayPalOrder(price, bookingId),
//     onSuccess: (data) => {
//       setPaypalOrderId(data.orderId) // Store PayPal order ID
//       setIsCheckoutModalOpen(true)
//     },
//     onError: (error) => {
//       console.error("Error creating PayPal order:", error)
//       // Handle error (show toast, etc.)
//     },
//   })

//   const handlePayNow = () => {
//     if (paymentMethod === "paypal") {
//       mutation.mutate()
//     }
//   }

//   return (
//     <>
//       {/* Payment Method Selection Modal */}
//       <Dialog open={isOpen} onOpenChange={onClose}>
//         <DialogContent className="sm:max-w-[425px] p-6">
//           <DialogHeader>
//             <DialogTitle className="text-2xl font-bold text-gray-900">Select Payment Method</DialogTitle>
//             <p>${price}</p>
//             <DialogDescription className="sr-only">Choose your preferred payment method.</DialogDescription>
//           </DialogHeader>
//           <div className="grid gap-4 py-4">
//             <RadioGroup 
//               value={paymentMethod} 
//               onValueChange={setPaymentMethod}
//               className="grid gap-2"
//             >
//               <div className="flex items-center justify-between rounded-md border p-4">
//                 <div className="flex items-center gap-3">
//                   <img src="/placeholder.svg?height=24&width=24" alt="PayPal" className="h-6 w-6" />
//                   <Label htmlFor="paypal" className="text-base font-medium text-gray-900">
//                     PayPal
//                   </Label>
//                 </div>
//                 <RadioGroupItem value="paypal" id="paypal" />
//               </div>
//             </RadioGroup>
//           </div>
//           <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
//             <Button 
//               className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90" 
//               onClick={handlePayNow}
//               disabled={mutation.isPending}
//             >
//               {mutation.isPending ? "Processing..." : "Pay Now"}
//             </Button>
//             <p className="text-center text-sm text-gray-500 mt-2">Other Payment Methods Coming Soon!</p>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* PayPal Checkout Modal */}
//       <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
//         <DialogContent className="p-5 w-full">
//           {paypalOrderId && (
//             <PayPalCheckout
//               planId="687221b652944a219c699c83"
//               userId={userId}
//               orderId={paypalOrderId} // Pass the PayPal order ID here
              
//             />
//           )}
//         </DialogContent>
//       </Dialog>
//     </>
//   )
// }

"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "next-auth/react";
import PayPalCheckout from "./PaypalcheckoutFrom";

interface PaymentMethodModalProps {
  isOpen: boolean;
  price: string;
  bookingId?: string;
  onClose: () => void;
}

interface PayPalOrderResponse {
  success: boolean;
  message: string;
  orderId: string; // PayPal order ID
  bookingId?: string; // Your internal booking ID
}

async function createPayPalOrder(amount: string, bookingId?: string): Promise<PayPalOrderResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/payments/paypal/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, bookingId }),
  });

  if (!response.ok) {
    throw new Error("Failed to create PayPal order");
  }

  return response.json();
}

export function PaymentMethodModal({ isOpen, onClose, price, bookingId }: PaymentMethodModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState("");
  const session = useSession();
  const userId = session?.data?.user?.id || "";

  const { mutate, isPending } = useMutation({
    mutationFn: () => createPayPalOrder(price, bookingId),
    onSuccess: (data) => {
      setPaypalOrderId(data.orderId); // Store PayPal order ID
      setIsCheckoutModalOpen(true);
    },
    onError: (error) => {
      console.error("Error creating PayPal order:", error);
      // Handle error (show toast, etc.)
    },
  });

  const handlePayNow = () => {
    if (paymentMethod === "paypal") {
      mutate();
    }
  };

  return (
    <>
      {/* Payment Method Selection Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Select Payment Method</DialogTitle>
            <p>${price}</p>
            <DialogDescription className="sr-only">Choose your preferred payment method.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={setPaymentMethod}
              className="grid gap-2"
            >
              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="flex items-center gap-3">
                  <img src="/paypal-logo.png" alt="PayPal" className="h-6 w-6" />
                  <Label htmlFor="paypal" className="text-base font-medium text-gray-900">
                    PayPal
                  </Label>
                </div>
                <RadioGroupItem value="paypal" id="paypal" />
              </div>
            </RadioGroup>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button 
              className="w-full bg-[#2B7FD0] text-white hover:bg-[#2B7FD0]/90" 
              onClick={handlePayNow}
              disabled={isPending}
            >
              {isPending ? "Processing..." : "Pay Now"}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-2">Other Payment Methods Coming Soon!</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PayPal Checkout Modal */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="p-5 w-full max-w-md ">
          {paypalOrderId && (
            <PayPalCheckout
              planId="687221b652944a219c699c83"
              userId={userId}
              orderId={paypalOrderId}     
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}