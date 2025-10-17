"use client";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { authAPI } from "@/lib/auth-api";

interface VerifyOTPProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function VerifyOTP({ email, onBack, onSuccess }: VerifyOTPProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.verifyOTP,
    onSuccess: () => {
      toast.success("OTP verified successfully!");
      onSuccess();
    },
    onError: () => {
      toast.error("Invalid or expired OTP. Please try again.");
    },
  });

  const focusInput = (index: number) => {
    const el = inputsRef.current[index];
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < otp.length - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        focusInput(index - 1);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length === 6) {
      mutate({ email, otp: otpString } as any);
    } else {
      toast.error("Please enter the full 6-digit OTP.");
    }
  };

  const handleResendCode = () => {
    toast.info("Resending OTP...");
    // TODO: Implement resend endpoint
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Verify Your Email</h2>
        <p className="text-gray-600 text-sm">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
        </p>
      </div>

      <div className="flex justify-center space-x-2">
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-12 text-center text-lg font-semibold"
          />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Didn’t get a code?</span>
        <button
          type="button"
          onClick={handleResendCode}
          className="text-sm text-blue-600 hover:underline"
        >
          Resend Code
        </button>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isPending || otp.join("").length !== 6}
          className="flex-1 bg-primary hover:bg-blue-700 text-white"
        >
          {isPending ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </form>
  );
}
