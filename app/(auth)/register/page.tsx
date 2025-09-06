"use client";

import type React from "react";
import { Suspense, useState, useEffect, useMemo, forwardRef } from "react";
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
import {
  Calendar as CalendarIcon,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { authAPI, type RegisterData } from "@/lib/auth-api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Country {
  name: string;
  code: string;
  dial_code: string;
}

type ValidRole = "candidate" | "recruiter" | "company";
const VALID_ROLES: ValidRole[] = ["candidate", "recruiter", "company"];

// Handles reading ?role=candidate|recruiter|company
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

  return null;
}

// Custom input for DatePicker to match shadcn Button look & feel
const DateButton = forwardRef<
  HTMLButtonElement,
  { value?: string; onClick?: () => void }
>(({ value, onClick }, ref) => (
  <Button
    type="button"
    variant="outline"
    onClick={onClick}
    ref={ref}
    className={cn(
      "w-full justify-start text-left font-normal h-11",
      !value && "text-muted-foreground"
    )}
  >
    <CalendarIcon className="mr-2 h-4 w-4" />
    {value || <span>Select your date</span>}
  </Button>
));
DateButton.displayName = "DateButton";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    phoneNum: "",
    address: "",
    role: "candidate",
  });

  // DOB via react-datepicker
  const [dob, setDob] = useState<Date | null>(null);

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // PRIMARY role starts as candidate per your request
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

  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<RegisterData | null>(
    null
  );
  const [showUnderAgeDialog, setShowUnderAgeDialog] = useState(false);

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
    if (field === "password") validatePassword(value);
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    const selectedCountryData = countries.find((c) => c.name === value);
    const dialCode = selectedCountryData ? selectedCountryData.dial_code : "";
    setFormData((prev) => ({
      ...prev,
      address: value,
      phoneNum: dialCode + prev.phoneNum.replace(/^\+\d+/, ""),
    }));
  };

  // ---- Age helpers ----
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Cutoff = today - 16 years (must be born on/before this)
  const cutoff = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 16);
    return d;
  }, [today]);

  const oldestAllowed = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(d.getFullYear() - 100);
    return d;
  }, [today]);

  const dobISO = useMemo(
    () =>
      dob
        ? new Date(Date.UTC(dob.getFullYear(), dob.getMonth(), dob.getDate()))
            .toISOString()
            .slice(0, 10)
        : "",
    [dob]
  );

  const isUnder16 = useMemo(() => (dob ? dob > cutoff : false), [dob, cutoff]);

  useEffect(() => {
    if (dob && isUnder16) setShowUnderAgeDialog(true);
  }, [dob, isUnder16]);

  // use isPending (fixes TS error you saw)
  const primaryCtaText = useMemo(() => {
    if (registerMutation.isPending) return "Creating Account...";
    if (selectedRole === "candidate") return "Sign up as a Candidate";
    if (selectedRole === "recruiter") return "Sign up as a Recruiter";
    return "Sign up as a Company";
  }, [registerMutation.isPending, selectedRole]);

  // Now DOB is required for all roles (you requested all fields show for any role)
  const needsDob = true;

  const validateBeforeSubmit = () => {
    if (needsDob) {
      if (!dob) {
        alert("Please select your Date of Birth.");
        return false;
      }
      if (isUnder16) {
        setShowUnderAgeDialog(true);
        return false;
      }
    }
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
    const payload = {
      ...data,
      dateOfBirth: dobISO || undefined,
    } as unknown as RegisterData;
    registerMutation.mutate(payload);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;
    const fullFormData: RegisterData = {
      ...formData,
      name: `${firstName} ${surname}`.trim(),
    };
    setPendingFormData(fullFormData);
    setShowRoleConfirm(true);
  };

  // --- Derived secondary buttons for simpler, standard swap behavior
  const secondaryButtons = useMemo(
    () => VALID_ROLES.filter((r) => r !== selectedRole),
    [selectedRole]
  );

  // Clicking a secondary button: set it as the new primary.
  // Because secondaries are derived, the previous primary will automatically appear among them.
  const handleSecondaryRoleClick = (clickedRole: ValidRole) => {
    if (clickedRole === selectedRole) return;
    setSelectedRole(clickedRole);
    // small UX: focus the primary CTA (optional)
    // document.getElementById("primary-cta")?.focus();
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

            {/* Surname */}
            <div className="space-y-2">
              <Label htmlFor="surname">Surname</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

            {/* Country */}
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

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

            {/* DOB - shown for all roles */}
            <div className="space-y-2">
              <Label className="mr-5">Date of Birth</Label>

              <DatePicker
                selected={dob}
                onChange={(date) => setDob(date)}
                // Ensure selection between [oldestAllowed, cutoff]
                minDate={oldestAllowed}
                maxDate={new Date()}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                dateFormat="PPP"
                shouldCloseOnSelect
                popperPlacement="bottom-start"
                customInput={<DateButton />}
              />

              {dob && isUnder16 && (
                <p className="text-sm text-destructive">
                  You must be at least 16 years old to register.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                  <p className="text-sm font-medium text-red-600 mb-1">
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
                      A minimum of 10 characters
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

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-pressed={showConfirmPassword}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(!!checked)}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Terms &amp; Conditions
                </Link>
              </Label>
            </div>

            {/* Primary submit */}
            <Button
              id="primary-cta"
              type="submit"
              className="w-full font-bold text-md transition duration-150 ease-in-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2"
              disabled={registerMutation.isPending}
              aria-live="polite"
            >
              {primaryCtaText}
            </Button>

            {/* Secondary role toggles (derived from VALID_ROLES) */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2 text-center">
                Prefer a different role?
              </p>
              <div className="flex gap-2">
                {secondaryButtons.map((value) => {
                  const label =
                    value === "recruiter"
                      ? "Sign up as a Recruiter"
                      : value === "company"
                      ? "Sign up as a Company"
                      : "Sign up as a Candidate";

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSecondaryRoleClick(value)}
                      className={cn(
                        "w-full px-4 py-2 border rounded-md transition transform duration-150 ease-in-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1",
                        selectedRole === value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-accent"
                      )}
                      aria-label={`Switch primary role to ${value}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                Currently selected:{" "}
                <span className="font-semibold">{selectedRole}</span>. Submit to
                continue.
              </p>

              {/* Screen-reader live region for role changes */}
              <div aria-live="polite" className="sr-only">
                Role changed to {selectedRole}
              </div>
            </div>

            {/* Login link */}
            <div className="text-center">
              <span className="text-sm font-semibold text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                href="/login"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Sign In Here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Role confirmation */}
      <AlertDialog open={showRoleConfirm} onOpenChange={setShowRoleConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm your sign-up role</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to create an account as{" "}
              <span className="font-semibold">
                {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
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
            <div>
              DOB:{" "}
              <span className="font-medium">
                {dob ? format(dob, "PPP") : "—"}
              </span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  // reset selection so the secondary role buttons are unselected
                  setSelectedRole("candidate");
                  // close the dialog
                  setShowRoleConfirm(false);
                }}
              >
                Change role
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
                    if (isUnder16) {
                      setShowRoleConfirm(false);
                      setShowUnderAgeDialog(true);
                      return;
                    }
                    actuallySubmit(payload);
                  }
                  setShowRoleConfirm(false);
                }}
              >
                Confirm &amp; Continue
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Under-16 dialog */}
      <AlertDialog
        open={showUnderAgeDialog}
        onOpenChange={setShowUnderAgeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Age Requirement</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                Sorry we&apos;re unable to register you today. We look forward
                to welcoming you when you reach the minimum age of 16.
              </span>
              <br />
              <span className="text-xs text-muted-foreground">
                If you selected the wrong date, please adjust your Date of Birth
                above.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button type="button">OK</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
