export function applicantCount(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value !== "number" && typeof value !== "string") continue;
    if (typeof value === "string" && !/^\d+$/.test(value.trim())) continue;
    const count = Number(value);
    if (Number.isSafeInteger(count) && count >= 0) return count;
  }
  return null;
}
export function applicantLabel(count: number | null): string | null {
  return count === null ? null : `${count} ${count === 1 ? "applicant" : "applicants"}`;
}
export function locationTypeLabel(value: unknown): string {
  return ({ onsite: "Onsite", remote: "Remote", hybrid: "Hybrid" } as Record<string, string>)[String(value ?? "").trim().toLowerCase()] || "Not specified";
}
export function employmentTypeLabel(value: unknown): string {
  return ({ "full-time": "Full-Time", "part-time": "Part-Time", internship: "Internship", contract: "Contract", temporary: "Temporary", freelance: "Freelance", volunteer: "Volunteer" } as Record<string, string>)[String(value ?? "").trim().toLowerCase()] || "Not specified";
}
export function jobCardDate(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value.trim())) continue;
    const text = value.trim();
    const [year, month, day] = text.slice(0, 10).split("-").map(Number);
    const calendar = new Date(Date.UTC(year, month - 1, day));
    if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) continue;
    const date = new Date(text.length === 10 ? `${text}T00:00:00` : text);
    if (Number.isFinite(date.getTime())) return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  return "Date not provided";
}
