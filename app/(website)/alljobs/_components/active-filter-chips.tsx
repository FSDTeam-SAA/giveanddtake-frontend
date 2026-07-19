"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import {
  EMPLOYMENT_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  useJobCategories,
} from "./job-filters";

const FILTER_KEYS = ["q", "category", "locationType", "employmentType", "location"] as const;

interface Chip {
  key: (typeof FILTER_KEYS)[number];
  label: string;
}

export default function ActiveFilterChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categoriesData } = useJobCategories();

  const q = searchParams.get("q") || searchParams.get("title") || "";
  const category = searchParams.get("category") || "";
  const locationType = searchParams.get("locationType") || "";
  const employmentType = searchParams.get("employmentType") || "";
  const location = searchParams.get("location") || "";

  const chips: Chip[] = [];
  if (q) chips.push({ key: "q", label: `“${q}”` });
  if (category) {
    const name = categoriesData?.data?.category?.find(
      (c) => c._id === category
    )?.name;
    chips.push({ key: "category", label: name || "Category" });
  }
  if (locationType) {
    const label =
      LOCATION_TYPE_OPTIONS.find((o) => o.value === locationType)?.label ||
      locationType;
    chips.push({ key: "locationType", label });
  }
  if (employmentType) {
    const label =
      EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === employmentType)?.label ||
      employmentType;
    chips.push({ key: "employmentType", label });
  }
  if (location) chips.push({ key: "location", label: location });

  if (chips.length === 0) return null;

  const removeKeys = (keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of keys) params.delete(key);
    if (keys.includes("q")) params.delete("title");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <span className="text-sm text-gray-600">Active filters:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => removeKeys([chip.key])}
          aria-label={`Remove filter ${chip.label}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <span className="max-w-[200px] truncate">{chip.label}</span>
          <X className="w-3.5 h-3.5" aria-hidden />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={() => removeKeys([...FILTER_KEYS])}
          className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 ml-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
