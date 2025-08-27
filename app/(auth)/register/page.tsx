"use client";

import type React from "react";
import { Suspense, useState, useEffect } from "react";
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
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!validatePassword(formData.password)) {
      alert("Password does not meet the requirements");
      return;
    }

    if (!agreeToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    // Combine first name and surname into the name field
    const fullFormData = {
      ...formData,
      name: `${firstName} ${surname}`,
    };

    registerMutation.mutate(fullFormData);
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

            <Button
              type="submit"
              className="w-full font-bold text-md"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? "Creating Account..."
                : selectedRole === "candidate"
                ? "Sign up as a Candidate"
                : selectedRole === "recruiter"
                ? "Sign up as a Recruiter"
                : "Sign up as a Company"}
            </Button>

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

            <div className="flex justify-center space-x-4 pt-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-transparent"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-transparent"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
