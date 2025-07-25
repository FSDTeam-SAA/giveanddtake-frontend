"use client";

import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authAPI } from "@/lib/auth-api";

export default function VerifyPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const verifyMutation = useMutation({
    mutationFn: authAPI.verifyOTP,
    onSuccess: () => {
      router.push(`/security-questions?email=${encodeURIComponent(email)}`);
    },
    onError: (error) => {
      console.error("OTP verification failed:", error);
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length === 6) {
      verifyMutation.mutate({
        email,
        otp: otpString,
      });
    }
  };

  const handleResendCode = () => {
    console.log("Resending code...");
    // Add resend OTP logic here
  };

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
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={
                    index === 0
                      ? (e) => {
                          e.preventDefault();
                          const pasteData = e.clipboardData
                            .getData("text")
                            .replace(/\D/g, "");
                          if (pasteData.length === 6) {
                            setOtp(pasteData.split("").slice(0, 6));
                            const lastInput = document.getElementById(`otp-5`);
                            lastInput?.focus();
                          }
                        }
                      : undefined
                  }
                  className="w-12 h-12 text-center text-lg font-semibold"
                  placeholder={index < 3 ? "*" : ""}
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {"Didn't get a code?"}
              </span>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-blue-600 hover:underline"
              >
                Resend Code
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={verifyMutation.isPending || otp.join("").length !== 6}
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
