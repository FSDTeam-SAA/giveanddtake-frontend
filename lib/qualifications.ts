export type Qualification = { value: string; label: string; active?: boolean };
export const defaultQualifications: Qualification[] = [
  ["BSc", "B.Sc"], ["B.Tech", "B.Tech"], ["B.A", "B.A"], ["B.Ed", "B.Ed"],
  ["B.Eng", "B.Eng"], ["LLB", "LL.B"], ["LLM", "LL.M"], ["M.B.A", "M.B.A"],
  ["MSc", "M.Sc"], ["M.Phil", "M.Phil"], ["M.Eng", "M.Eng"], ["Ph.D", "Ph.D"],
  ["High School", "High School"], ["College", "College"], ["Sixth Form", "Sixth Form"],
  ["ONC", "ONC"], ["OND", "OND"], ["HNC", "HNC"], ["HND", "HND"],
].map(([value, label]) => ({ value, label }));

const key = (value: string) => value.replace(/[.\s]/g, "").toLowerCase();
export function qualificationLabel(value: string | null | undefined, catalog = defaultQualifications): string {
  if (!value) return "";
  return catalog.find(item => item.value === value || key(item.label) === key(value) || key(item.value) === key(value))?.label || value;
}

export function qualificationOptions(catalog: Qualification[], selected?: string): Qualification[] {
  const options = catalog.filter(item => item.active !== false);
  if (selected && !options.some(item => item.value === selected)) {
    return [...options, { value: selected, label: qualificationLabel(selected, catalog) }];
  }
  return options;
}
