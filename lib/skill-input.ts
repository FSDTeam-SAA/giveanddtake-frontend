export const normalizeSkill = (value: string) => value.trim().replace(/\s+/g, ' ');
export const skillIdentity = (value: string) => normalizeSkill(value).toLowerCase();
export function addSkillValue(selected: string[], value: string): { skills: string[]; error?: string } {
  const name = normalizeSkill(value);
  if (!name) return { skills: selected };
  if (value.length > 100) return { skills: selected, error: 'Each skill can be at most 100 characters.' };
  if (selected.some(item => skillIdentity(item) === skillIdentity(name))) return { skills: selected };
  if (selected.length >= 30) return { skills: selected, error: 'You can add at most 30 skills.' };
  return { skills: [...selected, name] };
}
