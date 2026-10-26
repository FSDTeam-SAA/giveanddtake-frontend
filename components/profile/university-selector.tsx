"use client";

import { forwardRef, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UniversitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}
type Institution = { _id: string; name: string; country?: string };

export const UniversitySelector = forwardRef<HTMLInputElement, UniversitySelectorProps>(function UniversitySelector({
  value, onChange, onBlur, placeholder = "Type your University/College/High School", disabled = false, ...props
}, ref) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const query = useQuery<Institution[]>({
    queryKey: ["universities"],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/university`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || body.status !== "success" || !Array.isArray(body.data)) throw new Error("Suggestions unavailable");
      return body.data.filter((item: Institution) => typeof item.name === "string");
    },
  });
  const search = (value || "").trim().toLowerCase();
  const options = (query.data || []).filter(item => !search || item.name.toLowerCase().includes(search)
    || item.country?.toLowerCase().includes(search)).slice(0, 10);
  const expanded = open && !disabled;
  const select = (item: Institution) => { onChange(item.name); setOpen(false); setSelectedIndex(-1); };

  return <div className="relative">
    <div className="relative">
      <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input {...props} ref={ref} value={value || ""} placeholder={placeholder} disabled={disabled}
        maxLength={150} autoComplete="off" role="combobox" aria-autocomplete="list"
        aria-expanded={expanded} aria-controls={listId}
        aria-activedescendant={expanded && selectedIndex >= 0 && options[selectedIndex] ? `${listId}-${selectedIndex}` : undefined}
        className="pl-10"
        onChange={event => { onChange(event.target.value); setOpen(true); setSelectedIndex(-1); }}
        onFocus={() => { setOpen(true); setSelectedIndex(-1); }}
        onBlur={() => { setOpen(false); onBlur?.(); }}
        onKeyDown={event => {
          if (event.key === "Escape") { setOpen(false); return; }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); setOpen(true);
            setSelectedIndex(index => options.length ? (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length : -1);
          }
          if (event.key === "Enter" && expanded && selectedIndex >= 0 && options[selectedIndex]) {
            event.preventDefault(); select(options[selectedIndex]);
          }
        }} />
    </div>
    {expanded && <div className="pointer-events-none absolute z-30 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
      <ul id={listId} role="listbox" aria-label="Institution suggestions" className="max-h-60 overflow-y-auto">
        {options.map((item, index) => <li key={item._id} id={`${listId}-${index}`} role="option"
          aria-selected={selectedIndex === index} className={selectedIndex === index ? "bg-gray-100" : ""}>
          <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => select(item)}
            className="pointer-events-auto w-full px-4 py-2 text-left hover:bg-gray-100 [overflow-wrap:anywhere]">
            <span className="block font-medium">{item.name}</span>
            {item.country && <span className="block text-sm text-gray-500">{item.country}</span>}
          </button>
        </li>)}
      </ul>
      <p role="status" className="border-t px-4 py-2 text-xs text-gray-600">
        {query.isLoading ? "Loading suggestions. You can keep typing." : query.isError
          ? "Suggestions are unavailable. You can still type an institution name."
          : !options.length ? "No matches. You can save the name you typed." : "Choose a suggestion or keep your typed name."}
      </p>
    </div>}
  </div>;
});
