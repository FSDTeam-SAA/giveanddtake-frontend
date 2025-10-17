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
import { authAPI } from "@/lib/auth-api"; // Make sure this file has sendEmailOTP & verifyOTP

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
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // resend timer
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  /* ---------------- Step 1: Security Questions ---------------- */
  const handleSecurityComplete = (token: string) => {
    setResetToken(token);
    setStep("email");
  };

  /* ---------------- Step 2: Send OTP ---------------- */
  const handleEmailSubmit = async () => {
    if (!newEmail) {
      toast.error("Please enter a new email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.sendEmailOTP({ email: newEmail });
      toast.success("OTP sent to your new email!");
      setStep("otp");
      setResendTimer(60); // start countdown
    } catch (error) {
      console.error(error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- Step 3: Resend OTP ---------------- */
  const handleResendOTP = async () => {
    if (!newEmail) return;
    setIsResending(true);
    try {
      await authAPI.sendEmailOTP({ email: newEmail });
      toast.success("OTP resent successfully!");
      setResendTimer(60);
    } catch (error) {
      toast.error("Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  // countdown effect
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  /* ---------------- Step 4: OTP Success ---------------- */
  const handleOtpSuccess = () => {
    toast.success("Email changed successfully!");
    onOpenChange(false);
    setStep("security");
    setNewEmail("");
    setResetToken(null);
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
                After verifying, we’ll send a one-time passcode (OTP) to confirm your new email address.
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
              onSuccess={handleOtpSuccess}
            />

            {/* Resend OTP Section */}
            <div className="flex justify-center items-center mt-6">
              {resendTimer > 0 ? (
                <p className="text-sm text-gray-500">
                  You can resend the OTP in{" "}
                  <span className="font-medium text-gray-700">
                    {resendTimer}s
                  </span>
                </p>
              ) : (
                <Button
                  variant="link"
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {isResending ? "Resending..." : "Resend OTP"}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
