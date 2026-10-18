export function applicationStatusLabel(
  status?: string | null,
  pendingLabel = "Application Received"
): string {
  const value = (status ?? "").trim().toLowerCase();
  if (["rejected", "reject", "unsuccessful", "not shortlisted", "not_shortlisted"].includes(value)) {
    return "Unsuccessful";
  }
  if (value === "pending" || value === "application received") return pendingLabel;
  if (value === "shortlisted") return "Shortlisted";
  return status ?? "";
}
