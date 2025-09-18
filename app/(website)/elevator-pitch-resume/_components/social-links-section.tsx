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
import { Link as LinkIcon } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";
import { useEffect, useMemo } from "react";

interface SocialLink {
  label: string;
  url: string;
}

interface SocialLinksSectionProps {
  form: UseFormReturn<any>;
}

const FIXED_PLATFORMS = [
  "LinkedIn",
  "Twitter",
  "Upwork",
  "Facebook",
  "TikTok",
  "Instagram",
] as const;

export function SocialLinksSection({ form }: SocialLinksSectionProps) {
  // Ensure the form always has exactly 6 entries with fixed labels
  const initialLinks: SocialLink[] = useMemo(() => {
    const existing: SocialLink[] = form.getValues("sLink") ?? [];
    return FIXED_PLATFORMS.map((label, i) => ({
      label,
      url: existing[i]?.url ?? "",
    }));
  }, [form]);

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
          <LinkIcon className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle className="text-lg font-medium">Social Links</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Add URLs for your social and professional profiles (optional)
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIXED_PLATFORMS.map((platform, index) => (
            <FormField
              // We only allow editing the URL; label is fixed
              key={platform}
              control={form.control}
              name={`sLink.${index}.url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{platform} URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`https://${platform.toLowerCase()}.com/your-profile`}
                      {...field}
                    />
                  </FormControl>
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
