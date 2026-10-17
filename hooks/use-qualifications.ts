"use client";
import { useQuery } from "@tanstack/react-query";
import { defaultQualifications, Qualification, qualificationLabel, qualificationOptions } from "@/lib/qualifications";

export function useQualifications() {
  const { data } = useQuery<Qualification[]>({
    queryKey: ["qualifications"],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/qualifications`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load qualifications");
      const body = await response.json();
      if (!Array.isArray(body.data)) throw new Error("Invalid qualification list");
      return body.data;
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const catalog = data ?? defaultQualifications;
  return {
    options: (selected?: string) => qualificationOptions(catalog, selected),
    label: (value?: string | null) => qualificationLabel(value, catalog),
  };
}
