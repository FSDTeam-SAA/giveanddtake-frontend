"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { SecurityQuestions } from "./security-questions";
import { VerifyOTP } from "./VerifyOTP";
import axios from "axios";
import { useSession } from "next-auth/react";

interface ChangeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export function ChangeEmailModal({
  open,
  onOpenChange,
  currentEmail,
}: ChangeEmailModalProps) {
  const [step, setStep] = useState<"security" | "email" | "otp">("security");
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { data: session } = useSession();
  const token = session?.accessToken;

  /* ---------------- Step 1: Security Questions ---------------- */
  const handleSecurityComplete = () => {
    setStep("email");
  };

  /* ---------------- Step 2: Submit new email ---------------- */
  const handleEmailSubmit = async () => {
    if (!newEmail) {
      toast.error("Please enter a new email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/change-email`,
        { email: newEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`, // or whatever your backend expects
          },
        }
      );
      if (res.data?.success) {
        toast.success("Email change initiated. OTP sent to your new email.");
        setStep("otp");
        setResendTimer(60);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- Step 3: Resend OTP ---------------- */
  const handleResendOTP = async () => {
    if (!newEmail) return;
    setIsResending(true);
    try {
      const res = await axios.post("/api/change-email", { email: newEmail });
      if (res.data?.success) {
        toast.success("OTP resent successfully!");
        setResendTimer(60);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || "Failed to resend OTP.";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  /* ---------------- Countdown Effect ---------------- */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  /* ---------------- Step 4: Verify OTP ---------------- */
  const handleOtpVerify = () => {
    return history;
  };

  /* ---------------- Helper: Reset modal ---------------- */
  const resetState = () => {
    setStep("security");
    setNewEmail("");
    setResendTimer(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {/* STEP 1: SECURITY QUESTIONS */}
        {step === "security" && (
          <>
            <DialogHeader>
              <DialogTitle>Verify Your Identity</DialogTitle>
              <DialogDescription>
                Please answer your security questions to continue changing your email.
              </DialogDescription>
            </DialogHeader>

            <SecurityQuestions
              onBack={() => onOpenChange(false)}
              onComplete={handleSecurityComplete}
            />
          </>
        )}

        {/* STEP 2: ENTER NEW EMAIL */}
        {step === "email" && (
          <>
            <DialogHeader>
              <DialogTitle>Enter New Email</DialogTitle>
              <DialogDescription>
                We’ll send a one-time passcode (OTP) to confirm your new email address.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label
                  htmlFor="current-email"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Current Email
                </Label>
                <Input
                  id="current-email"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <Label
                  htmlFor="new-email"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  New Email
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="Enter your new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  maxLength={254}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("security")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleEmailSubmit}
                disabled={isSubmitting}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {isSubmitting ? "Sending OTP..." : "Continue"}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* STEP 3: VERIFY OTP */}
        {step === "otp" && (
          <>
            <DialogHeader>
              <DialogTitle>Verify New Email</DialogTitle>
              <DialogDescription>
                Enter the 6-digit OTP sent to your new email to confirm the change.
              </DialogDescription>
            </DialogHeader>

            <VerifyOTP
              email={newEmail}
              onBack={() => setStep("email")}
              onSuccess={handleOtpVerify}
            />

            
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
