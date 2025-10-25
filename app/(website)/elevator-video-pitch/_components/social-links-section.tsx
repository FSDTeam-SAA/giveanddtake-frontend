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
import { useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";

interface SocialLinkRow {
  label: string; // stored/posted label (normalized)
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

type BasePlatform = (typeof BASE_PLATFORMS)[number];

const NORMALIZED_OTHER_LABEL = "Others" as const;
type StorageKey = BasePlatform | typeof NORMALIZED_OTHER_LABEL | "Other";

// For placeholders
const PLATFORM_PLACEHOLDER: Record<string, string> = {
  LinkedIn: "https://www.linkedin.com/your-profile",
  Twitter: "https://www.twitter.com/your-profile",
  Facebook: "https://facebook.com/your-profile",
  TikTok: "https://www.tiktok.com/@your-handle",
  Instagram: "https://www.instagram.com/your-profile",
  Upwork: "https://www.upwork.com/your-profile",
  Fiverr: "https://www.fiverr.com/your-username",
  "Company Website": "https://your-website.com",
  "Portfolio Website": "https://your-website.com",
  Other: "https://your-website.com",
};

export function SocialLinksSection({ form }: SocialLinksSectionProps) {
  const { data } = useSession();
  const role = data?.user?.role;

  // UI-only label for the last field
  const dynamicOtherLabel: "Company Website" | "Portfolio Website" | "Other" =
    role === "recruiter" || role === "company"
      ? "Company Website"
      : role === "candidate"
      ? "Portfolio Website"
      : "Other";

  // Only normalize to "Others" for Company/Portfolio UI cases
  const normalizeToOthers =
    dynamicOtherLabel === "Company Website" ||
    dynamicOtherLabel === "Portfolio Website";

  // Normalize arbitrary incoming label text to a storage key
  const normalizeIncomingLabelToKey = (raw: string): StorageKey => {
    const s = (raw || "").trim().toLowerCase();
    if (s === "company website" || s === "portfolio website" || s === "others")
      return "Others";
    if (s === "other") return "Other";
    const found = (BASE_PLATFORMS as readonly string[]).find(
      (p) => p.toLowerCase() === s
    );
    return (found as BasePlatform) ?? (raw as StorageKey);
  };

  // For a given UI label, which storage keys should we try (in order)?
  const candidateKeysForUiLabel = (uiLabel: string): StorageKey[] => {
    if (uiLabel === dynamicOtherLabel) {
      return normalizeToOthers ? ["Others", "Other"] : ["Other", "Others"];
    }
    return [uiLabel as BasePlatform];
  };

  // Fixed platforms + dynamic UI label at the end
  const FIXED_PLATFORMS = useMemo(
    () => [...BASE_PLATFORMS, dynamicOtherLabel],
    [dynamicOtherLabel]
  );

  // ---------- CRITICAL PART ----------
  // On first render (and whenever role / dynamicOtherLabel changes), rebuild the sLink array
  // by label -> fixed order, and RESET the form so RHF indices match UI indices.
  const hasResetRef = useRef(false);

  useEffect(() => {
    // Read whatever is currently in the form (likely server defaults)
    const current = (form.getValues("sLink") ?? []) as SocialLinkRow[];

    // Build lookup by normalized label
    const byKey: Record<string, SocialLinkRow> = {};
    for (const item of current) {
      if (!item) continue;
      const key = normalizeIncomingLabelToKey(item.label);
      if (!byKey[key] || !!item.url) {
        byKey[key] = { label: key, url: item.url ?? "" };
      }
    }

    // Build merged array in fixed UI order, filling with URLs by label match
    const merged: SocialLinkRow[] = FIXED_PLATFORMS.map((uiLabel) => {
      const storageKey: StorageKey =
        uiLabel === dynamicOtherLabel
          ? normalizeToOthers
            ? "Others"
            : "Other"
          : (uiLabel as BasePlatform);

      const candidates = candidateKeysForUiLabel(uiLabel);
      const existingMatch =
        byKey[candidates[0]] || byKey[candidates[1]] || byKey[candidates[2]];

      return {
        label: storageKey, // what we will submit
        url: existingMatch?.url ?? "",
      };
    });

    // Only reset if needed: first time, or when length/labels don't match the UI
    const needsReset =
      !hasResetRef.current ||
      !Array.isArray(current) ||
      current.length !== merged.length ||
      current.some((row, idx) => {
        const expected = merged[idx];
        return (
          normalizeIncomingLabelToKey(row?.label ?? "") !== expected.label
        );
      });

    if (needsReset) {
      form.reset(
        { ...(form.getValues() as any), sLink: merged },
        { keepDirty: false, keepTouched: false }
      );
      hasResetRef.current = true;
    }
  }, [
    form,
    FIXED_PLATFORMS,
    dynamicOtherLabel,
    normalizeToOthers,
  ]);
  // -----------------------------------

  const sectionTitle =
    role === "company"
      ? "Company Social Media Links"
      : "Professional Social Media and Website Links";

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div>
            <CardTitle className="text-md font-medium text-gray-900">
              {sectionTitle}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIXED_PLATFORMS.map((uiLabel, index) => {
            const storageKey: StorageKey =
              uiLabel === dynamicOtherLabel
                ? normalizeToOthers
                  ? "Others"
                  : "Other"
                : (uiLabel as BasePlatform);

            return (
              <FormField
                key={`${uiLabel}-${index}`}
                control={form.control}
                name={`sLink.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{uiLabel} URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          PLATFORM_PLACEHOLDER[uiLabel] ??
                          "https://your-website.com"
                        }
                        {...field}
                      />
                    </FormControl>

                    {/* Hidden input ensures label is the normalized storage key */}
                    <input
                      type="hidden"
                      value={storageKey}
                      {...form.register(`sLink.${index}.label`)}
                    />

                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
