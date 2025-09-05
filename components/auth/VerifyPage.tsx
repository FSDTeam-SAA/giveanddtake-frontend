"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authAPI } from "@/lib/auth-api";

export default function VerifyPage() {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Destructure isPending and mutate from useMutation (v5)
  const {
    mutate,
    status, // "idle" | "pending" | "success" | "error"
    isPending, // boolean helper you should use for "loading" state on mutations
    error,
  } = useMutation({
    mutationFn: authAPI.verifyOTP,
    onSuccess: () => {
      router.push(`/security-questions?email=${encodeURIComponent(email)}`);
    },
    onError: (err) => {
      console.error("OTP verification failed:", err);
    },
  });

  const focusInput = (index: number) => {
    const el = inputsRef.current[index];
    el?.focus();
    if (el) {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < inputsRef.current.length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        focusInput(index - 1);
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < inputsRef.current.length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasteData) return;

    const pasteDigits = pasteData.split("");
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < Math.min(6, pasteDigits.length); i++) {
      newOtp[i] = pasteDigits[i];
    }
    setOtp(newOtp);

    const firstEmpty = newOtp.findIndex((d) => d === "");
    if (firstEmpty === -1) {
      focusInput(5);
    } else {
      focusInput(firstEmpty);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length === 6) {
      // use mutate (destructured) instead of verifyMutation.mutate
      mutate({
        email,
        otp: otpString,
      } as any);
    }
  };

  const handleResendCode = () => {
    console.log("Resending code...");
    // Add resend OTP logic here
  };

  // Use isPending (mutation) — this is the correct boolean to show a "loading" state for a mutation in v5
  const isVerifying = isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Enter OTP</CardTitle>
          <p className="text-gray-600">
            We have sent a code to your registered email address
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  ref={(el: HTMLInputElement | null) => {
                    inputsRef.current[index] = el;
                  }}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              {/* <span className="text-sm text-gray-600">
                {"Didn't get a code?"}
              </span>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-blue-600 hover:underline"
              >
                Resend Code
              </button> */}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isVerifying || otp.join("").length !== 6}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>

            {status === "error" && error && (
              <p className="text-sm text-red-600 mt-2">
                Verification failed. Please try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
