"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

interface SocialLinkRow {
  label: string;
  url: string;
}

interface SocialLinksSectionProps {
  form: UseFormReturn<any>;
}

const BASE_PLATFORMS = [
  "LinkedIn",
  "Twitter",
  "Facebook",
  "TikTok",
  "Instagram",
  "Upwork",
  "Fiverr",
] as const;

export function SocialLinksSection({ form }: SocialLinksSectionProps) {
  const session = useSession();
  const role = session.data?.user?.role;

  // Dynamically decide what to call the last label (for UI)
  const dynamicOtherLabel =
    role === "recruiter" || role === "company"
      ? "Company Website"
      : role === "candidate"
      ? "Portfolio Website"
      : "Other";

  // Fixed platforms + dynamic label
  const FIXED_PLATFORMS = useMemo(
    () => [...BASE_PLATFORMS, dynamicOtherLabel],
    [dynamicOtherLabel]
  );

  // Initialize form values
  const initialLinks: SocialLinkRow[] = useMemo(() => {
    const existing: SocialLinkRow[] = form.getValues("sLink") ?? [];
    return FIXED_PLATFORMS.map((label, i) => ({
      label,
      url: existing[i]?.url ?? "",
    }));
  }, [form, FIXED_PLATFORMS]);

  const sectionTitle =
    role === "company"
      ? "Company Social Media Links"
      : "Professional Social Media and Website Links";

  useEffect(() => {
    form.setValue("sLink", initialLinks, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [form, initialLinks]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div>
            <CardTitle className="text-md font-medium text-gray-900">
              {sectionTitle}
            </CardTitle>
            {/* <p className="text-sm text-muted-foreground mt-1">
              Add URLs for your social and professional profiles and websites.
            </p> */}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIXED_PLATFORMS.map((platform, index) => (
            <FormField
              key={platform}
              control={form.control}
              name={`sLink.${index}.url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{platform} URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        platform === dynamicOtherLabel
                          ? "https://your-website.com"
                          : `https://${platform.toLowerCase()}.com/your-profile`
                      }
                      {...field}
                    />
                  </FormControl>

                  {/* 
                    Store normalized label value ("Other") for backend and icon mapping.
                    The display label (Company Website / Portfolio Website) is only for UI.
                  */}
                  <input
                    type="hidden"
                    value={
                      platform === dynamicOtherLabel && platform !== "Other"
                        ? "Other"
                        : platform
                    }
                    {...form.register(`sLink.${index}.label`)}
                  />

                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
