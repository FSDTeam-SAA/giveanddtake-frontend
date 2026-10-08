import { queryOptions } from "@tanstack/react-query";

export interface JobResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// All consumers cache the API envelope. Pages that need only the job use select.
export function jobQueryOptions<T = Record<string, any>>(
  jobId: string,
  baseUrl = process.env.NEXT_PUBLIC_BASE_URL,
) {
  return queryOptions({
    queryKey: ["job", jobId] as const,
    queryFn: async ({ signal }): Promise<JobResponse<T>> => {
      if (!jobId || jobId === "undefined") throw new Error("Invalid job ID");
      const response = await fetch(`${baseUrl}/jobs/${jobId}`, {
        signal,
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch job details (HTTP ${response.status})`);
      }
      const result = (await response.json()) as JobResponse<T>;
      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch job details");
      }
      return result;
    },
    enabled: Boolean(jobId && jobId !== "undefined"),
    // Approval happens in a separate admin app, outside this browser's cache.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
