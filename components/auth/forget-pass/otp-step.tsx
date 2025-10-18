"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OtpStepProps {
  email: string;
  otp: string;
  onOtpChange: (otp: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function OtpStep({
  email,
  otp,
  onOtpChange,
  onNext,
  onBack,
}: OtpStepProps) {
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(123);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ---------------- Timer Countdown ---------------- */
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  /* ---------------- OTP Input Change ---------------- */
  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.replace(/\D/g, ""); // allow only digits
    setOtpValues(newOtpValues);
    onOtpChange(newOtpValues.join(""));

    // Move focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* ---------------- Paste Handler (Any Input) ---------------- */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");
    if (!pastedData) return;

    const newOtpValues = [...otpValues];
    for (let i = 0; i < 6 - index; i++) {
      if (pastedData[i]) newOtpValues[index + i] = pastedData[i];
    }

    // If pasted more than needed, still only use 6 total digits
    const merged = newOtpValues.slice(0, 6);
    setOtpValues(merged);
    onOtpChange(merged.join(""));

    // Focus last filled input
    const nextIndex = Math.min(index + pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  /* ---------------- Backspace Navigation ---------------- */
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /* ---------------- Submit Handler ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const otpString = otpValues.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      setIsLoading(false);
      return;
    }

    try {
      onNext();
    } catch (error) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- Resend OTP ---------------- */
  const handleResendCode = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      await fetch(`${baseUrl}/user/forget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      setTimeLeft(123);
      setError("");
    } catch (error) {
      setError("Failed to resend code. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Verify OTP</h1>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <p className="text-gray-600 mt-2">
          We’ve sent a code to your registered email address.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otpValues.map((value, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(e, index)} // 👈 works on ANY input
              className="w-12 h-12 text-center text-lg font-semibold border-2 focus:ring-2 focus:ring-blue-500"
              placeholder={value ? "•" : ""}
            />
          ))}
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Code expires in {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={handleResendCode}
            className={`font-medium ${
              timeLeft > 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-700"
            }`}
            disabled={timeLeft > 0}
          >
            Resend Code
          </button>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-blue-700"
            disabled={isLoading || otpValues.join("").length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </form>
    </div>
  );
}
