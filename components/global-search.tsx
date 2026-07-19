"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import {
  Search,
  User,
  Building2,
  UserCheck,
  Clock,
  Loader2,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchPeople, type PersonResult } from "@/lib/search-api";

type Role = "candidate" | "recruiter" | "company";

interface GlobalSearchProps {
  onResultSelect?: () => void;
}

const RECENT_KEY = "evp:recent-people-searches";
const MAX_RECENT = 5;

function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string").slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  if (typeof window === "undefined") return;
  const t = term.trim();
  if (!t) return;
  const next = [t, ...readRecentSearches().filter((s) => s.toLowerCase() !== t.toLowerCase())].slice(
    0,
    MAX_RECENT
  );
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage full/blocked — recents are best-effort
  }
}

export function GlobalSearch({ onResultSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debounced = useDebounce(query.trim(), 300);

  const { data, isFetching } = useQuery({
    queryKey: ["people-search", debounced],
    queryFn: ({ signal }) =>
      fetchPeople({ q: debounced, page: 1, limit: 8 }, signal),
    enabled: debounced.length > 0,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const results = data?.data?.users ?? [];

  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAndReset = useCallback(() => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  }, []);

  const handleResultClick = (person: PersonResult) => {
    const role = (person.role as Role) || "candidate";
    const slug = person.slug ?? "";
    const profileUrl =
      role === "company"
        ? `/cmp/${slug}`
        : role === "recruiter"
        ? `/rp/${slug}`
        : `/cp/${slug}`;

    saveRecentSearch(query);
    setRecentSearches(readRecentSearches());
    onResultSelect?.();
    router.push(profileUrl);
    closeAndReset();
  };

  const handleSeeAllResults = () => {
    const q = query.trim();
    saveRecentSearch(q);
    setRecentSearches(readRecentSearches());
    onResultSelect?.();
    router.push(q ? `/all-users?s=${encodeURIComponent(q)}` : "/all-users");
    closeAndReset();
  };

  const clearRecentSearches = () => {
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
    setRecentSearches([]);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "candidate":
        return <User className="h-4 w-4 text-green-600" aria-hidden />;
      case "recruiter":
        return <UserCheck className="h-4 w-4 text-primary" aria-hidden />;
      case "company":
        return <Building2 className="h-4 w-4 text-purple-600" aria-hidden />;
      default:
        return <User className="h-4 w-4 text-gray-600" aria-hidden />;
    }
  };

  const availableCount = results.filter(
    (r) => r.role === "candidate" && r.immediatelyAvailable === true
  ).length;

  const hasQuery = query.trim().length > 0;
  const showRecent = !hasQuery && recentSearches.length > 0;
  const showDropdown = isOpen && (hasQuery || showRecent);

  return (
    <div ref={containerRef} className="relative w-full max-w-md min-w-[220px]">
      <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <div className="relative">
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10"
          />
          <CommandPrimitive.Input
            ref={inputRef}
            value={query}
            onValueChange={(value) => {
              setQuery(value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setIsOpen(false);
              }
            }}
            placeholder="Search people, companies..."
            maxLength={200}
            role="combobox"
            aria-expanded={showDropdown}
            aria-label="Search people and companies"
            className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-[16px] leading-5"
          />
          {isFetching && hasQuery && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-live="polite"
              aria-busy="true"
            >
              <Loader2 className="h-4 w-4 text-primary animate-spin" aria-hidden />
            </div>
          )}
        </div>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <CommandList className="max-h-96" aria-busy={isFetching}>
              {showRecent && (
                <CommandGroup
                  heading={
                    <div className="flex items-center justify-between">
                      <span>Recent searches</span>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1"
                        aria-label="Clear recent searches"
                      >
                        <X className="h-3 w-3" aria-hidden />
                        Clear
                      </button>
                    </div>
                  }
                >
                  {recentSearches.map((term) => (
                    <CommandItem
                      key={`recent-${term}`}
                      value={`recent:${term}`}
                      onSelect={() => setQuery(term)}
                      className="gap-2"
                    >
                      <Clock className="h-4 w-4 text-gray-400" aria-hidden />
                      <span className="truncate">{term}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {hasQuery && isFetching && results.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <div className="inline-flex items-center gap-2">
                    <Loader2
                      className="h-4 w-4 text-primary animate-spin"
                      aria-hidden
                    />
                    <span className="text-sm">Searching...</span>
                  </div>
                </div>
              )}

              {hasQuery && results.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50 flex items-center justify-between">
                    <div>Top results</div>
                    {availableCount > 0 && (
                      <span className="inline-flex items-center gap-2 text-gray-600">
                        <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                        <span>{availableCount} immediately available</span>
                      </span>
                    )}
                  </div>

                  <CommandGroup>
                    {results.map((person) => {
                      const displayName = person.name || "Unnamed";
                      const firstLetter = (
                        person.name?.charAt(0) || "U"
                      ).toUpperCase();
                      const avatarUrl =
                        person.avatar?.url ||
                        "/placeholder.svg?height=40&width=40";
                      const secondary =
                        [person.position, person.location || person.address]
                          .filter(Boolean)
                          .join(" • ") || "N/A";
                      const isAvailable =
                        person.role === "candidate" &&
                        person.immediatelyAvailable === true;

                      return (
                        <CommandItem
                          key={person._id}
                          value={`person:${person._id}`}
                          onSelect={() => handleResultClick(person)}
                          className="px-4 py-3 gap-3 border-b border-gray-100 last:border-b-0 cursor-pointer"
                          aria-label={`Open profile for ${displayName}`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl} alt="" />
                            <AvatarFallback className="bg-primary text-white">
                              {firstLetter}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {displayName}
                              </span>
                              {isAvailable && (
                                <span
                                  className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-0.5 bg-green-50 text-green-800 shrink-0"
                                  title="Immediately available"
                                >
                                  <span className="h-2 w-2 rounded-full bg-green-600 inline-block" />
                                  Immediate
                                </span>
                              )}
                              {getRoleIcon(person.role)}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {secondary}
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}

              {hasQuery && !isFetching && results.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Search
                    className="h-8 w-8 mx-auto mb-2 text-gray-300"
                    aria-hidden
                  />
                  <p className="text-sm">
                    No results found for &ldquo;{query.trim()}&rdquo;.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try searching for people, companies, or locations
                  </p>
                </div>
              )}

              {hasQuery && (
                <CommandGroup>
                  <CommandItem
                    value="__see-all-results"
                    onSelect={handleSeeAllResults}
                    className="justify-center py-3 text-primary font-medium text-sm cursor-pointer border-t bg-gray-50"
                  >
                    Show all results
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}
