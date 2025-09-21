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
import { toast } from "sonner";

// ⬇️ NEW: custom MM/YYYY input replaces react-datepicker
import CustomDateInput from "@/components/custom-date-input";

/* =========================
   Types / constants
========================= */
interface Country {
  name: string;
  code: string;
  dial_code: string;
}

type ValidRole = "candidate" | "recruiter" | "company";
const VALID_ROLES: ValidRole[] = ["candidate", "recruiter", "company"];

/* =========================
   Local Storage Helpers
========================= */
const LS_KEYS = {
  formData: "register.formData",
  firstName: "register.firstName",
  surname: "register.surname",
  dobISO: "register.dobISO",
  agreeToTerms: "register.agreeToTerms",
  selectedCountry: "register.selectedCountry",
  selectedRole: "register.selectedRole",
} as const;

const safeParseJSON = <T,>(raw: string | null, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const isBrowser = typeof window !== "undefined";

/* =========================
   URL Role selector (unchanged)
========================= */
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

/* =========================
   Validation Helpers
========================= */
const nameRegex = /^[A-Za-z' -]*$/; // letters, spaces, apostrophes, hyphens
const emailRegex =
  // reasonably strict but practical RFC 5322–ish
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// normalize to one optional leading + and digits only after
const sanitizePhone = (raw: string) => {
  const trimmed = raw.replace(/\s+/g, "");
  // remove all non + or digits
  let cleaned = trimmed.replace(/[^+\d]/g, "");
  // ensure at most a single leading +
  cleaned = cleaned.replace(/\+/g, (m, offset) => (offset === 0 ? "+" : ""));
  // strip any '+' that is not at the start
  if (cleaned.length > 0 && cleaned[0] !== "+") {
    cleaned = cleaned.replace(/\+/g, "");
  }
  // also prevent things like "+123+45"
  const plusIndex = cleaned.indexOf("+");
  if (plusIndex > 0) {
    cleaned = cleaned.replace(/\+/g, "");
  }
  return cleaned;
};

export default function RegisterPage() {
  const router = useRouter();

  /* =========================
     State (with LS hydration)
  ========================= */
  const [formData, setFormData] = useState<RegisterData>(() => {
    if (!isBrowser) {
      return {
        name: "",
        email: "",
        password: "",
        phoneNum: "",
        address: "",
        role: "candidate",
      };
    }
    return safeParseJSON<RegisterData>(localStorage.getItem(LS_KEYS.formData), {
      name: "",
      email: "",
      password: "",
      phoneNum: "",
      address: "",
      role: "candidate",
    });
  });

  const [dob, setDob] = useState<Date | null>(() => {
    if (!isBrowser) return null;
    const iso = localStorage.getItem(LS_KEYS.dobISO);
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d;
  });

  // NEW: keep a controlled string for the MM/YYYY input (so partial typing doesn't fight Date parsing)
  const [dobInput, setDobInput] = useState<string>(() => {
    if (!isBrowser) return "";
    const iso = localStorage.getItem(LS_KEYS.dobISO);
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : format(d, "MM/yyyy");
  });

  const [firstName, setFirstName] = useState<string>(() => {
    if (!isBrowser) return "";
    return localStorage.getItem(LS_KEYS.firstName) ?? "";
  });

  const [surname, setSurname] = useState<string>(() => {
    if (!isBrowser) return "";
    return localStorage.getItem(LS_KEYS.surname) ?? "";
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(() => {
    if (!isBrowser) return false;
    return localStorage.getItem(LS_KEYS.agreeToTerms) === "true";
  });

  const [selectedRole, setSelectedRole] = useState<ValidRole>(() => {
    if (!isBrowser) return "candidate";
    const fromLS =
      (localStorage.getItem(LS_KEYS.selectedRole) as ValidRole | null) ??
      "candidate";
    return VALID_ROLES.includes(fromLS) ? fromLS : "candidate";
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (!isBrowser) return "";
    return localStorage.getItem(LS_KEYS.selectedCountry) ?? "";
  });

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: formData.password.length >= 10,
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(
      formData.password
    ),
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
  });

  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<RegisterData | null>(
    null
  );
  const [showUnderAgeDialog, setShowUnderAgeDialog] = useState(false);

  /* =========================
     React Query Mutation (unchanged)
  ========================= */
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);

      if (error.errorSources?.length > 0) {
        toast.error(error.errorSources[0].message);
      } else {
        toast.error(error.message);
      }
    },
  });

  /* =========================
     Effects
  ========================= */
  // Keep formData.role in sync with selectedRole
  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  }, [selectedRole]);

  // Fetch countries once
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries/codes"
        );
        const data = await response.json();
        if (!data.error) {
          setCountries(data.data as Country[]);
          // Initialize selection ONLY if nothing in LS
          if (!selectedCountry && data.data.length > 0) {
            const initial = data.data[0] as Country;
            setSelectedCountry(initial.name);
            setFormData((prev) => ({
              ...prev,
              address: initial.name,
              phoneNum:
                // ensure we don't duplicate dial code if LS already has one
                prev.phoneNum && prev.phoneNum.startsWith(initial.dial_code)
                  ? prev.phoneNum
                  : initial.dial_code,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage whenever relevant fields change
  useEffect(() => {
    if (!isBrowser) return;
    localStorage.setItem(LS_KEYS.formData, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (!isBrowser) return;
    localStorage.setItem(LS_KEYS.firstName, firstName);
  }, [firstName]);

  useEffect(() => {
    if (!isBrowser) return;
    localStorage.setItem(LS_KEYS.surname, surname);
  }, [surname]);

  useEffect(() => {
    if (!isBrowser) return;
    const dobISO = dob
      ? new Date(Date.UTC(dob.getFullYear(), dob.getMonth(), 1))
          .toISOString()
          .slice(0, 10)
      : "";
    localStorage.setItem(LS_KEYS.dobISO, dobISO);
  }, [dob]);

  useEffect(() => {
    if (!isBrowser) return;
    localStorage.setItem(LS_KEYS.agreeToTerms, String(agreeToTerms));
  }, [agreeToTerms]);

  useEffect(() => {
    if (!isBrowser) return;
    localStorage.setItem(LS_KEYS.selectedCountry, selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    if (!isBrowser) return;
    localStorage.setItem(LS_KEYS.selectedRole, selectedRole);
  }, [selectedRole]);

  /* =========================
     Password Validation
  ========================= */
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

  /* =========================
     Controlled Handlers with Validation
  ========================= */

  // Shared setter for RegisterData fields with validation hooks
  const handleInputChange = (field: keyof RegisterData, value: string) => {
    if (field === "email") {
      value = value.trim();
    }

    if (field === "password") {
      validatePassword(value);
    }

    // Phone special handling: keep leading dial code behavior and enforce numeric characters
    if (field === "phoneNum") {
      // sanitize user keystrokes to + and digits only
      let next = sanitizePhone(value);

      // Enforce that the selected country's dial code is present as prefix
      const selectedCountryData = countries.find(
        (country) => country.name === formData.address
      );
      const dialCode = selectedCountryData ? selectedCountryData.dial_code : "";

      if (dialCode) {
        // ensure next starts with dialCode (which includes '+')
        if (!next.startsWith(dialCode)) {
          // strip any leading +country part, keep the rest digits
          const withoutDial = next.replace(/^\+\d+/, "");
          next = dialCode + withoutDial;
        }
      }

      setFormData((prev) => ({ ...prev, phoneNum: next }));
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    const selectedCountryData = countries.find((c) => c.name === value);
    const dialCode = selectedCountryData ? selectedCountryData.dial_code : "";
    setFormData((prev) => {
      const stripped = sanitizePhone(prev.phoneNum).replace(/^\+\d+/, "");
      const nextPhone = dialCode + stripped;
      return {
        ...prev,
        address: value,
        phoneNum: nextPhone,
      };
    });
  };

  // Prevent illegal chars at input level for names and phone.
  const blockNonNameChars: React.FormEventHandler<HTMLInputElement> = (e) => {
    const target = e.target as HTMLInputElement;
    if (!nameRegex.test(target.value)) {
      target.value = target.value.replace(/[^A-Za-z' -]/g, "");
    }
  };

  const preventInvalidPhoneKey: React.KeyboardEventHandler<HTMLInputElement> = (
    e
  ) => {
    const allowedControl = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "Tab",
    ];
    if (allowedControl.includes(e.key)) return;

    // allow digits
    if (/^\d$/.test(e.key)) return;

    // allow a single leading '+'
    const input = e.currentTarget;
    if (
      e.key === "+" &&
      input.selectionStart === 0 &&
      !input.value.includes("+")
    )
      return;

    // otherwise block
    e.preventDefault();
  };

  // extra guard for paste into phone
  const onPhonePaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData("text");
    const sanitized = sanitizePhone(text);
    if (sanitized.length === 0) {
      e.preventDefault();
      return;
    }
  };

  /* =========================
     DOB / Age helpers (unchanged logic)
  ========================= */
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

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
        ? new Date(Date.UTC(dob.getFullYear(), dob.getMonth(), 1))
            .toISOString()
            .slice(0, 10)
        : "",
    [dob]
  );

  const isUnder16 = useMemo(() => {
    if (!dob) return false;
    const dobPlus16 = new Date(dob);
    dobPlus16.setFullYear(dobPlus16.getFullYear() + 16);
    return dobPlus16 > today;
  }, [dob, today]);

  useEffect(() => {
    if (dob && isUnder16) setShowUnderAgeDialog(true);
  }, [dob, isUnder16]);

  /* =========================
     CTA Text (unchanged)
  ========================= */
  const primaryCtaText = useMemo(() => {
    if (registerMutation.isPending) return "Creating Account...";
    if (selectedRole === "candidate") return "Sign up as a Candidate";
    if (selectedRole === "recruiter") return "Sign up as a Recruiter";
    return "Sign up as a Company";
  }, [registerMutation.isPending, selectedRole]);

  const needsDob = true;

  /* =========================
     Submit Validations
  ========================= */
  const validateBeforeSubmit = () => {
    // First/surname
    if (!firstName.trim() || !nameRegex.test(firstName)) {
      toast.error("Please enter a valid First Name.");
      return false;
    }
    if (!surname.trim() || !nameRegex.test(surname)) {
      toast.error("Please enter a valid Surname.");
      return false;
    }

    // Email
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    // Country
    if (!formData.address) {
      toast.error("Please select your country.");
      return false;
    }

    // Phone (must be + and digits only, at least dial code + 4 digits typical)
    const sanitizedPhone = sanitizePhone(formData.phoneNum);
    if (!/^\+\d{4,}$/.test(sanitizedPhone)) {
      toast.error("Please enter a valid phone number (e.g., +123456789).");
      return false;
    }

    // DOB
    if (needsDob) {
      if (!dob) {
        toast.error("Please select your Date of Birth (MM/YYYY).");
        return false;
      }
      if (isUnder16) {
        setShowUnderAgeDialog(true);
        return false;
      }
      // also ensure not in future and within allowed range
      if (dob > today || dob < oldestAllowed) {
        toast.error("Please select a valid Date of Birth.");
        return false;
      }
    }

    // Password
    if (formData.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (!validatePassword(formData.password)) {
      toast.error("Password does not meet the requirements");
      return false;
    }

    // Terms
    if (!agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return false;
    }

    return true;
  };

  const actuallySubmit = (data: RegisterData) => {
    const payload = {
      ...data,
      dateOfbirth: dobISO || undefined,
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

  const secondaryButtons = useMemo(
    () => VALID_ROLES.filter((r) => r !== selectedRole),
    [selectedRole]
  );

  const handleSecondaryRoleClick = (clickedRole: ValidRole) => {
    if (clickedRole === selectedRole) return;
    setSelectedRole(clickedRole);
  };

  /* =========================
     Render
  ========================= */
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
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-z' -]/g, "");
                    setFirstName(val);
                  }}
                  onInput={blockNonNameChars}
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
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-z' -]/g, "");
                    setSurname(val);
                  }}
                  onInput={blockNonNameChars}
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
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && !emailRegex.test(v)) {
                      toast.error("Invalid email format.");
                    }
                  }}
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
                  inputMode="tel"
                  autoComplete="tel"
                  onKeyDown={preventInvalidPhoneKey}
                  onPaste={onPhonePaste}
                  onChange={(e) =>
                    handleInputChange("phoneNum", e.target.value)
                  }
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Only digits allowed. Keep the leading “+” and country code.
              </p>
            </div>

            {/* DOB - month/year only using CustomDateInput (stores YYYY-MM-01) */}
            <div className="space-y-2">
              <Label className="mr-5">Date of Birth (MM/YYYY)</Label>

              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <CustomDateInput
                  value={dobInput}
                  onChange={(val) => {
                    setDobInput(val);
                    // when fully typed MM/YYYY, parse and set normalized Date
                    const full = /^\d{2}\/\d{4}$/.test(val);
                    if (!full) {
                      setDob(null);
                      return;
                    }
                    const [mmStr, yyyyStr] = val.split("/");
                    const mm = Number.parseInt(mmStr, 10);
                    const yyyy = Number.parseInt(yyyyStr, 10);

                    // guard month range (CustomDateInput also constrains this)
                    if (mm < 1 || mm > 12 || Number.isNaN(yyyy)) {
                      setDob(null);
                      return;
                    }

                    const normalized = new Date(yyyy, mm - 1, 1);
                    normalized.setHours(0, 0, 0, 0);

                    // keep previous behavior: allow typing but validate bounds on submit
                    // however, if clearly invalid (NaN), clear it
                    if (isNaN(normalized.getTime())) {
                      setDob(null);
                      return;
                    }

                    setDob(normalized);
                  }}
                  placeholder="MM/YYYY"
                  className="pl-10 h-11"
                />
              </div>

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
                {dob ? format(dob, "MM/yyyy") : "—"}
              </span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setSelectedRole("candidate");
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
                If you selected the wrong month or year, please adjust your Date
                of Birth above.
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
