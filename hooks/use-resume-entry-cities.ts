"use client";

import { useQueries } from "@tanstack/react-query";
import { useWatch, type UseFormReturn } from "react-hook-form";

export function useResumeEntryCities(
  form: UseFormReturn<any>,
  name: "experiences" | "educationList"
) {
  const entries = useWatch({ control: form.control, name }) || [];
  const selectedCountries: string[] = entries.map(
    (entry: { country?: string }) => entry.country || ""
  );
  const queries = useQueries({
    queries: selectedCountries.map((country) => ({
      queryKey: ["resume-entry-cities", country],
      enabled: !!country,
      queryFn: async (): Promise<string[]> => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/countries/cities`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country }),
          }
        );
        if (!response.ok) throw new Error("Failed to fetch cities");
        const data = await response.json();
        if (data.error) throw new Error("Failed to fetch cities");
        return data.data as string[];
      },
    })),
  });

  // Each query follows this entry's country, including resets, removals and
  // saved drafts. Results for a previous country cannot replace the new list.
  return {
    selectedCountries,
    citiesData: queries.map((query, index) =>
      selectedCountries[index] ? query.data || [] : []
    ),
    loadingCities: queries.map(
      (query, index) => !!selectedCountries[index] && query.isPending
    ),
  };
}
