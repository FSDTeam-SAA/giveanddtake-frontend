"use client";

import { useEffect, useState } from "react";
import { getJobAvailability, type JobAvailabilityInput } from "@/lib/job-availability";

export function useJobAvailability(job: JobAvailabilityInput | undefined) {
  const [now, setNow] = useState(Date.now);
  const deadline = job?.deadline ?? job?.expiryDate;
  useEffect(() => {
    const expiry = deadline ? Date.parse(deadline) : NaN;
    let timer: number | undefined;
    const update = () => {
      window.clearTimeout(timer);
      setNow(Date.now());
      const delay = expiry - Date.now();
      if (delay > 0) timer = window.setTimeout(update, Math.min(delay + 1, 2_147_483_647));
    };
    update();
    window.addEventListener("focus", update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", update);
    };
  }, [deadline]);
  return getJobAvailability(job, now);
}
