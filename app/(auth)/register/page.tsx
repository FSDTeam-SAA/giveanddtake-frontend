"use client";

import type React from "react";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import Link from "next/link";
import { authAPI, type RegisterData } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

interface Country {
  name: string;
  code: string;
  dial_code: string;
}

// Define the valid roles to check against
type ValidRole = "candidate" | "recruiter" | "company";
const VALID_ROLES: ValidRole[] = ["candidate", "recruiter", "company"];

// Child component to handle useSearchParams
function RoleSelector({ setRole }: { setRole: (role: ValidRole) => void }) {
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get("role") as ValidRole | null;
  const initialRole =
    roleFromUrl && VALID_ROLES.includes(roleFromUrl)
      ? roleFromUrl
      : "candidate";

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole, setRole]);

  return null; // This component only handles logic, no UI
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    phoneNum: "",
    address: "",
    role: "candidate", // Default role
  });
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ValidRole>("candidate");
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasUpperCase: false,
    hasLowerCase: false,
  });

  // NEW: confirmation dialog state
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<RegisterData | null>(
    null
  );

  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  }, [selectedRole]);

  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/codes"
        );
        const data = await response.json();
        if (!data.error) {
          setCountries(data.data);
          if (data.data.length > 0) {
            setSelectedCountry(data.data[0].name);
            setFormData((prev) => ({
              ...prev,
              address: data.data[0].name,
              phoneNum: data.data[0].dial_code,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  const validatePassword = (password: string) => {
    const validation = {
      minLength: password.length >= 10,
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    if (field === "phoneNum") {
      const selectedCountryData = countries.find(
        (country) => country.name === formData.address
      );
      const dialCode = selectedCountryData ? selectedCountryData.dial_code : "";
      if (!value.startsWith(dialCode)) {
        value = dialCode + value.replace(/^\+\d+/, "");
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "password") {
      validatePassword(value);
    }
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    const selectedCountryData = countries.find(
      (country) => country.name === value
    );
    const dialCode = selectedCountryData ? selectedCountryData.dial_code : "";
    setFormData((prev) => ({
      ...prev,
      address: value,
      phoneNum: dialCode + prev.phoneNum.replace(/^\+\d+/, ""),
    }));
  };

  // Derived text for the primary CTA
  const primaryCtaText = useMemo(() => {
    if (registerMutation.isPending) return "Creating Account...";
    if (selectedRole === "candidate") return "Sign up as a Candidate";
    if (selectedRole === "recruiter") return "Sign up as a Recruiter";
    return "Sign up as a Company";
  }, [registerMutation.isPending, selectedRole]);

  const validateBeforeSubmit = () => {
    if (formData.password !== confirmPassword) {
      alert("Passwords do not match");
      return false;
    }

    if (!validatePassword(formData.password)) {
      alert("Password does not meet the requirements");
      return false;
    }

    if (!agreeToTerms) {
      alert("Please agree to the terms and conditions");
      return false;
    }
    return true;
  };

  const actuallySubmit = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBeforeSubmit()) return;

    // Combine first name and surname into the name field
    const fullFormData: RegisterData = {
      ...formData,
      name: `${firstName} ${surname}`.trim(),
    };

    // Show the role confirmation dialog first
    setPendingFormData(fullFormData);
    setShowRoleConfirm(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div>Loading role...</div>}>
        <RoleSelector setRole={setSelectedRole} />
      </Suspense>

      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Create Your Account
          </CardTitle>
          <CardDescription>
            Sign-up and pitch your way into a new role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  placeholder="Enter First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="surname">Surname</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="surname"
                  placeholder="Enter Surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Country</Label>
              <Select
                onValueChange={handleCountryChange}
                disabled={isLoadingCountries}
                value={selectedCountry}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingCountries ? "Loading countries..." : "Country"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCountries ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  placeholder="Enter Phone Number"
                  value={formData.phoneNum}
                  onChange={(e) =>
                    handleInputChange("phoneNum", e.target.value)
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create Password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
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

              {formData.password && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-red-600 mb-2">
                    Passwords should be:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p
                      className={cn(
                        passwordValidation.minLength
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of '10 characters'
                    </p>
                    <p
                      className={cn(
                        passwordValidation.hasNumber
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of 1 number
                    </p>
                    <p
                      className={cn(
                        passwordValidation.hasSpecialChar
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of 1 special character
                    </p>
                    <p
                      className={cn(
                        passwordValidation.hasUpperCase
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of 1 upper case character
                    </p>
                    <p
                      className={cn(
                        passwordValidation.hasLowerCase
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      A minimum of 1 lower case character
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) =>
                  setAgreeToTerms(checked as boolean)
                }
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms & Conditions
                </Link>
              </Label>
            </div>

            {/* Primary submit button comes FIRST */}
            <Button
              type="submit"
              className="w-full font-bold text-md"
              disabled={registerMutation.isPending}
            >
              {primaryCtaText}
            </Button>

            {/* Secondary role choices moved BELOW the primary CTA */}
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2 text-center">
                Prefer a different role?
              </p>
              <div className="flex gap-2">
                {[
                  { value: "recruiter", label: "Sign up as a Recruiter" },
                  { value: "company", label: "Sign up as a Company" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setSelectedRole((prev) =>
                        prev === option.value
                          ? "candidate"
                          : (option.value as "recruiter" | "company")
                      )
                    }
                    className={cn(
                      "w-full px-4 py-2 border rounded-md transition-colors scale-y-95 font-bold",
                      selectedRole === option.value
                        ? "bg-primary text-white border-blue-600"
                        : "bg-transparent border-gray-300 hover:bg-gray-100"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {selectedRole !== "candidate" && (
                <p className="text-[11px] text-gray-500 mt-2 text-center">
                  Currently selected:{" "}
                  <span className="font-semibold">{selectedRole}</span>. Submit
                  to continue.
                </p>
              )}
            </div>

            <div className="text-center">
              <span className="text-sm font-bold text-gray-600">
                Already have an account?{" "}
              </span>
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                Sign In Here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation dialog for role choice */}
      <AlertDialog open={showRoleConfirm} onOpenChange={setShowRoleConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm your sign‑up role</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to create an account as{" "}
              <span className="font-semibold">
                {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </span>
              . You can change this now if it’s not what you intended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md bg-gray-50 p-3 text-sm">
            <div>
              Name:{" "}
              <span className="font-medium">
                {`${firstName} ${surname}`.trim() || "—"}
              </span>
            </div>
            <div>
              Email:{" "}
              <span className="font-medium">{formData.email || "—"}</span>
            </div>
            <div>
              Country:{" "}
              <span className="font-medium">{formData.address || "—"}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" type="button">
                Go back
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                onClick={() => {
                  if (pendingFormData) {
                    const payload: RegisterData = {
                      ...pendingFormData,
                      role: selectedRole,
                    };
                    actuallySubmit(payload);
                  }
                  setShowRoleConfirm(false);
                }}
              >
                Confirm & Continue
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
