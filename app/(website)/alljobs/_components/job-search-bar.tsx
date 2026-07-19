"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { Search, Briefcase, Wrench, FolderOpen, MapPin, Loader2 } from "lucide-react";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchJobSuggestions } from "@/lib/search-api";

const MIN_CHARS = 2;

export default function JobSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // `q` is the applied search; `title` is the legacy inbound param
  const appliedQuery =
    searchParams.get("q") || searchParams.get("title") || "";

  const [input, setInput] = useState(appliedQuery);
  const [open, setOpen] = useState(false);

  // Keep the input in sync when the URL changes externally (chips, back button)
  useEffect(() => {
    setInput(appliedQuery);
  }, [appliedQuery]);

  const debounced = useDebounce(input.trim(), 300);

  const { data, isFetching } = useQuery({
    queryKey: ["job-suggestions", debounced],
    queryFn: ({ signal }) => fetchJobSuggestions(debounced, signal),
    enabled: debounced.length >= MIN_CHARS,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const groups = data?.data?.groups;
  const hasSuggestions = useMemo(
    () =>
      !!groups &&
      (groups.titles.length > 0 ||
        groups.skills.length > 0 ||
        groups.categories.length > 0 ||
        groups.locations.length > 0),
    [groups]
  );

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("title"); // superseded by q
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const applySearch = (text: string) => {
    setOpen(false);
    setInput(text.trim());
    updateParams({ q: text.trim() || null });
  };

  const applyFilter = (key: "category" | "location", value: string) => {
    setOpen(false);
    setInput(appliedQuery); // typed fragment was only used to find the suggestion
    updateParams({ [key]: value });
  };

  const dropdownOpen = open && input.trim().length >= MIN_CHARS;

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full">
      <Command
        shouldFilter={false}
        className="overflow-visible bg-transparent flex-1"
      >
        <Popover open={dropdownOpen} modal={false}>
          <PopoverAnchor asChild>
            <div className="relative w-full">
              <Search
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10"
              />
              {isFetching && dropdownOpen && (
                <Loader2
                  aria-hidden
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin"
                />
              )}
              <CommandPrimitive.Input
                value={input}
                onValueChange={(value) => {
                  setInput(value);
                  setOpen(value.trim().length >= MIN_CHARS);
                }}
                onFocus={() => setOpen(input.trim().length >= MIN_CHARS)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setOpen(false);
                  }
                  if (e.key === "Enter" && !dropdownOpen) {
                    applySearch(input);
                  }
                }}
                placeholder="Search by title, skill, company, category or location"
                maxLength={200}
                role="combobox"
                aria-expanded={dropdownOpen}
                aria-label="Search jobs"
                className="h-11 w-full rounded-md border border-input bg-white pl-10 pr-9 text-[16px] leading-5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            sideOffset={6}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              // Clicks on the input itself shouldn't close the dropdown
              const target = e.target as HTMLElement | null;
              if (target?.closest("[cmdk-input]")) {
                e.preventDefault();
                return;
              }
              setOpen(false);
            }}
            className="w-[--radix-popover-trigger-width] p-0"
          >
            <CommandList className="max-h-80" aria-busy={isFetching}>
              <CommandGroup>
                <CommandItem
                  value={`__search:${input}`}
                  onSelect={() => applySearch(input)}
                  className="gap-2"
                >
                  <Search className="w-4 h-4 text-primary" aria-hidden />
                  <span>
                    Search for&nbsp;
                    <span className="font-medium">&ldquo;{input.trim()}&rdquo;</span>
                  </span>
                </CommandItem>
              </CommandGroup>

              {groups && groups.titles.length > 0 && (
                <CommandGroup heading="Job titles">
                  {groups.titles.map((item) => (
                    <CommandItem
                      key={`title-${item.value}`}
                      value={`title:${item.value}`}
                      onSelect={() => applySearch(item.value)}
                      className="gap-2"
                    >
                      <Briefcase className="w-4 h-4 text-primary" aria-hidden />
                      <span className="flex-1 truncate font-medium">{item.value}</span>
                      {typeof item.count === "number" && item.count > 1 && (
                        <span className="text-xs text-gray-400">
                          {item.count} jobs
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groups && groups.skills.length > 0 && (
                <CommandGroup heading="Skills">
                  {groups.skills.map((item) => (
                    <CommandItem
                      key={`skill-${item.value}`}
                      value={`skill:${item.value}`}
                      onSelect={() => applySearch(item.value)}
                      className="gap-2"
                    >
                      <Wrench className="w-4 h-4 text-gray-400" aria-hidden />
                      <span className="truncate">{item.value}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groups && groups.categories.length > 0 && (
                <CommandGroup heading="Categories">
                  {groups.categories.map((item) => (
                    <CommandItem
                      key={`category-${item.id}`}
                      value={`category:${item.value}`}
                      onSelect={() => item.id && applyFilter("category", item.id)}
                      className="gap-2"
                    >
                      <FolderOpen className="w-4 h-4 text-gray-400" aria-hidden />
                      <span className="flex-1 truncate">{item.value}</span>
                      <span className="text-xs text-gray-400">Category</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groups && groups.locations.length > 0 && (
                <CommandGroup heading="Locations">
                  {groups.locations.map((item) => (
                    <CommandItem
                      key={`location-${item.value}`}
                      value={`location:${item.value}`}
                      onSelect={() => applyFilter("location", item.value)}
                      className="gap-2"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" aria-hidden />
                      <span className="flex-1 truncate">{item.value}</span>
                      {typeof item.count === "number" && item.count > 1 && (
                        <span className="text-xs text-gray-400">
                          {item.count} jobs
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!isFetching && !hasSuggestions && (
                <div className="py-4 px-4 text-sm text-gray-500 text-center">
                  No suggestions — press Enter to search anyway
                </div>
              )}
            </CommandList>
          </PopoverContent>
        </Popover>
      </Command>

      <Button
        onClick={() => applySearch(input)}
        className="h-11 px-6 w-full md:w-auto"
        aria-label="Search jobs"
      >
        Search
      </Button>
    </div>
  );
}
