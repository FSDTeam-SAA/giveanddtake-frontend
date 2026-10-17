"use client";

import { PASSWORD_MAX_LENGTH } from "@/lib/password-policy";


import type React from "react";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const parseAuthError = (errorString?: string): Record<string, any> => {
    if (!errorString) return {};
    const cleaned = errorString.replace(/^Error:\s*/, "");
    try {
      return JSON.parse(cleaned);
    } catch {
      return { message: cleaned };
    }
  };

  // Load saved credentials on component mount
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('message') === 'session-expired') {
      setError('Your session expired. Sign in to continue where you left off.');
    }
    const loadSavedCredentials = () => {
      try {
        // Migrate older installations without retaining the saved password.
        const savedCredentials = localStorage.getItem('rememberedEmail') || localStorage.getItem("rememberedCredentials");
        if (savedCredentials) {
          const { email: savedEmail } =
            JSON.parse(savedCredentials);
          setEmail(savedEmail);
          setRememberMe(true);
        }
        localStorage.removeItem('rememberedCredentials');
      } catch (error) {
        console.error("Error loading saved credentials:", error);
        // Clear corrupted data
        localStorage.removeItem("rememberedCredentials");
      }
    };

    loadSavedCredentials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: String(rememberMe),
        redirect: false,
      });

      if (result?.error) {
        const parsed = parseAuthError(result.error);
        const message =
          parsed.message || "Invalid email or password. Please try again.";
        setError(message);
        toast.error(message);

        if (parsed.code === "UNVERIFIED" || parsed.nextStep === "verify-otp") {
          const targetEmail = parsed.email || email;
          router.push(`/verify?email=${encodeURIComponent(targetEmail)}`);
        }
      } else if (result?.ok) {
        // Save or clear credentials based on rememberMe
        try {
          if (rememberMe) {
            const credentials = { email: email.trim().toLowerCase() };
            localStorage.setItem(
              "rememberedEmail",
              JSON.stringify(credentials)
            );
          } else {
            localStorage.removeItem("rememberedEmail");
          }
        } catch (storageError) {
          console.error("Error accessing localStorage:", storageError);
        }

        const callback = new URLSearchParams(window.location.search).get('callbackUrl');
        const destination = callback ? new URL(callback, window.location.origin) : null;
        window.location.href = destination?.origin === window.location.origin &&
          !['/login', '/signup'].includes(destination.pathname)
          ? destination.pathname + destination.search + destination.hash
          : '/elevator-video-pitch';
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear saved credentials when user manually clears the form
  const handleClearSaved = () => {
    if (rememberMe) {
      setRememberMe(false);
      localStorage.removeItem("rememberedCredentials");
      localStorage.removeItem('rememberedEmail');
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
              <Label htmlFor="login-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="login-email"
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
              <Label htmlFor="login-password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="login-password"
                  maxLength={PASSWORD_MAX_LENGTH}
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

            <p className="text-xs text-gray-500">Stay signed in for 12 hours, or 30 days with Remember me.</p>
            {email && rememberMe && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <p>You will stay signed in for 30 days. Your email is remembered.</p>
                <button
                  type="button"
                  onClick={handleClearSaved}
                  className="text-blue-600 hover:underline mt-1"
                >
                  Clear saved credentials
                </button>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
