"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchJobCategories } from "@/lib/search-api";

const ALL = "all";

export const LOCATION_TYPE_OPTIONS = [
  { value: "onsite", label: "Onsite" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "freelance", label: "Freelance" },
  { value: "volunteer", label: "Volunteer" },
];

export function useJobCategories() {
  return useQuery({
    queryKey: ["job-categories"],
    queryFn: ({ signal }) => fetchJobCategories(signal),
    staleTime: 5 * 60_000,
  });
}

export default function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || ALL;
  const locationType = searchParams.get("locationType") || ALL;
  const employmentType = searchParams.get("employmentType") || ALL;

  const { data: categoriesData } = useJobCategories();
  const categories = categoriesData?.data?.category || [];

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
      <Select value={category} onValueChange={(v) => setParam("category", v)}>
        <SelectTrigger
          className="h-10 w-full md:w-[190px] bg-white"
          aria-label="Filter by category"
        >
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c._id} value={c._id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={locationType}
        onValueChange={(v) => setParam("locationType", v)}
      >
        <SelectTrigger
          className="h-10 w-full md:w-[160px] bg-white"
          aria-label="Filter by location type"
        >
          <SelectValue placeholder="Location type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All location types</SelectItem>
          {LOCATION_TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={employmentType}
        onValueChange={(v) => setParam("employmentType", v)}
      >
        <SelectTrigger
          className="h-10 w-full md:w-[170px] bg-white"
          aria-label="Filter by employment type"
        >
          <SelectValue placeholder="Employment type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All employment types</SelectItem>
          {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
