"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { FormLabel } from "@/components/ui/form";
import { addSkillValue, normalizeSkill, skillIdentity } from "@/lib/skill-input";

export interface SkillsSelectorHandle { commit(): string[] | null; }
export interface SkillsSelectorProps {
  selectedSkills: string[]; onSkillsChange: (skills: string[]) => void;
  showLabel?: boolean; error?: string;
}
export const SkillsSelector = forwardRef<SkillsSelectorHandle, SkillsSelectorProps>(function SkillsSelector({ selectedSkills, onSkillsChange, showLabel = true, error }, ref) {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/skill`, { signal: abort.signal, cache: "no-store" }).then(async response => {
      const payload = await response.json();
      if (!response.ok || !payload.success || !Array.isArray(payload.data)) throw new Error();
      const names: string[] = payload.data.filter((row: { name?: unknown; active?: boolean }) => typeof row.name === "string" && row.active !== false).map((row: { name: string }) => normalizeSkill(row.name)).filter(Boolean);
      setCatalog([...new Map(names.map(name => [skillIdentity(name), name])).values()]);
    }).catch(() => { if (!abort.signal.aborted) setFailed(true); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, []);
  const add = (value: string) => {
    const canonical = catalog.find(name => skillIdentity(name) === skillIdentity(value)) || value;
    const result = addSkillValue(selectedSkills, canonical);
    if (result.error) { setSelectionError(result.error); input.current?.focus(); return null; }
    setSelectionError(""); setQuery(""); onSkillsChange(result.skills); return result.skills;
  };
  useImperativeHandle(ref, () => ({ commit: () => add(query) }));
  const suggestions = query.trim() ? catalog.filter(name => skillIdentity(name).includes(skillIdentity(query)) && !selectedSkills.some(value => skillIdentity(value) === skillIdentity(name))).slice(0, 10) : [];
  const canAdd = query.trim() && !selectedSkills.some(value => skillIdentity(value) === skillIdentity(query));
  return <div className="space-y-2">
    {showLabel && <FormLabel>Skills*</FormLabel>}
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
      <Input ref={input} aria-label="Search Skills" placeholder="Search or type a skill" maxLength={100} value={query}
        onChange={event => { setQuery(event.target.value); setSelectionError(""); }}
        onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) { event.preventDefault(); add(query); } }} className="pl-10" />
      {suggestions.length > 0 && <div className="max-h-40 overflow-y-auto rounded-md border bg-white shadow-sm">
        {suggestions.map(name => <button key={skillIdentity(name)} type="button" className="block w-full px-4 py-2 text-left hover:bg-gray-100 [overflow-wrap:anywhere]" onClick={() => add(name)}>{name}</button>)}
      </div>}
    </div>
    {canAdd && <button type="button" className="text-sm text-blue-700 [overflow-wrap:anywhere]" onClick={() => add(query)}>Add “{normalizeSkill(query)}”</button>}
    {loading && <p role="status" className="text-sm text-gray-500">Loading suggestions. You can also type a skill.</p>}
    {failed && <p role="status" className="text-sm text-gray-500">Suggestions are unavailable. You can still add your own skills.</p>}
    <div className="flex flex-wrap gap-2">{selectedSkills.map((name, index) => <Badge key={index} variant="secondary" className="max-w-full gap-1 bg-blue-100 text-blue-800">
      <span className="min-w-0 [overflow-wrap:anywhere]">{name}</span><button type="button" aria-label={`Remove ${name}`} onClick={() => onSkillsChange(selectedSkills.filter((_, i) => i !== index))}><X className="h-3 w-3" /></button>
    </Badge>)}</div>
    {(selectionError || error) && <p role="alert" className="text-sm text-red-600">{selectionError || error}</p>}
  </div>;
});
