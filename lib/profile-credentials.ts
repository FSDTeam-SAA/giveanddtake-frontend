// Older clients sometimes saved stringified lists. Normalize for display only;
// saved profile content is never rewritten by this adapter.
export function credentialNames(value: unknown): string[] {
  if (typeof value === "string") {
    try { return credentialNames(JSON.parse(value)); } catch { return value.trim() ? [value.trim()] : []; }
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => typeof item === "string" && item.trim()
    ? item.trim().startsWith("[") ? credentialNames(item) : [item.trim()]
    : []);
}

export interface ProfileAward {
  _id?: string;
  title?: string;
  programeName?: string;
  programName?: string;
  programeDate?: string;
  description?: string;
}

export function profileAwards(value: unknown): ProfileAward[] {
  return Array.isArray(value) ? value.filter(item => item && typeof item === "object" &&
    [item.title, item.programeName, item.programName, item.description].some(text => typeof text === "string" && text.trim())) : [];
}
