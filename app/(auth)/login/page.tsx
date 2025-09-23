"use client";

import type React from "react";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Link from "next/link";

// API helpers used exactly like in your ElevatorPitchAndResume component
import {
  getCompanyAccount,
  getMyResume,
  getRecruiterAccount,
} from "@/lib/api-service";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const navigatingRef = { current: false };

  const checkProfileAndRedirect = async () => {
    if (navigatingRef.current) return; // prevent double navigations

    const session = await getSession();
    const role = (session as any)?.user?.role as string | undefined;
    const userId = (session as any)?.user?.id as string | undefined;

    if (!role || !userId) {
      navigatingRef.current = true;
      return router.replace("/");
    }

    try {
      if (role === "candidate") {
        const res = await getMyResume();
        const data = (res as any)?.data ?? res;
        const hasResume = Boolean(data?.resume);
        if (!hasResume) {
          navigatingRef.current = true;
          return router.replace("/elevator-pitch-resume");
        }
      } else if (role === "recruiter") {
        console.log("heloooooooooooooooooooo");
        const res: any = await getRecruiterAccount(userId);

        // Normalize shapes and types
        const payload = res?.data ?? res;
        const rawSuccess =
          typeof res?.success !== "undefined"
            ? res.success
            : typeof res?.data?.success !== "undefined"
            ? res.data.success
            : payload?.success;

        const success =
          rawSuccess === true || rawSuccess === "true"
            ? true
            : rawSuccess === false || rawSuccess === "false"
            ? false
            : undefined;

        // Try common locations for actual recruiter object
        const recruiterData =
          payload?.recruiter ?? payload?.data ?? payload?.result ?? null;

        // If API explicitly says false OR we have no recruiterData, send to setup
        if (success === false || !recruiterData) {
          navigatingRef.current = true;
          return router.replace("/elevator-pitch-resume");
        }
      } else {
        const res = await getCompanyAccount(userId);
        const data = (res as any)?.data ?? res;
        const companies = data?.companies;
        const hasCompany = Array.isArray(companies) && companies.length > 0;
        if (!hasCompany) {
          navigatingRef.current = true;
          return router.replace("/elevator-pitch-resume");
        }
      }

      // Default: profile exists
      navigatingRef.current = true;
      return router.replace("/");
    } catch (e: any) {
      // If helper throws for not-found, send to setup for recruiter/company
      const status = e?.response?.status ?? e?.status;
      if (role !== "candidate" && status === 404) {
        navigatingRef.current = true;
        return router.replace("/elevator-pitch-resume");
      }
      navigatingRef.current = true;
      return router.replace("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else if (result?.ok) {
        // Optional: persist rememberMe locally (depends on your auth strategy)
        try {
          if (rememberMe) localStorage.setItem("rememberedEmail", email);
          else localStorage.removeItem("rememberedEmail");
        } catch {}

        // After successful sign-in, check for profile existence and redirect accordingly
        await checkProfileAndRedirect();
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome back!</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don't have an account?{" "}
              </span>
              <Link
                href="/register"
                className="text-sm text-blue-600 hover:underline"
              >
                Sign Up Here.
              </Link>
            </div>

            <div className="flex justify-center space-x-4 pt-4"></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
