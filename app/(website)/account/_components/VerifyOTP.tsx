"use client";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { headers } from "next/headers";
import { useSession } from "next-auth/react";

interface VerifyOTPProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function VerifyOTP({ email, onBack, onSuccess }: VerifyOTPProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const { data: session } = useSession();
  const token = session?.accessToken;

  /* ---------------- Verify OTP Mutation ---------------- */
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const otpString = otp.join("");
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/user/verify`, {
        email,
        otp: otpString,
      });
      return response.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success("OTP verified successfully!");
        onSuccess();
        window.location.reload();
      } else {
        toast.error(res.message || "Verification failed.");
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Invalid or expired OTP. Please try again.";
      toast.error(msg);
    },
  });

  /* ---------------- OTP Input Behavior ---------------- */
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

  // ✅ Paste Handler (NEW)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("Text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);

    // Focus next empty input (or last one)
    const nextIndex = Math.min(pastedData.length, 5);
    focusInput(nextIndex);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length === 6) {
      mutate();
    } else {
      toast.error("Please enter the full 6-digit OTP.");
    }
  };

  const handleResendCode = async () => {
    try {
      toast.info("Resending OTP...");

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/change-email`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.success) {
        toast.success("OTP resent successfully!");
      } else {
        toast.error(res.data?.message || "Failed to resend OTP.");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to resend OTP.";
      toast.error(msg);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <div className="space-y-5">

        <div className="flex justify-center space-x-2 ">
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
              onPaste={handlePaste} // 👈 Added paste handler here
              className="w-12 h-12 text-center text-lg font-semibold"
            />
          ))}
        </div>
      </div>


      <div className="flex justify-between items-center">
        {/* <span className="text-sm text-gray-600">Didn’t get a code?</span>
        <button
          type="button"
          onClick={handleResendCode}
          className="text-sm text-blue-600 hover:underline"
        >
          Resend Code
        </button> */}
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
