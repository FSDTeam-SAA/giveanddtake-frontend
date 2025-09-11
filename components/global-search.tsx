"use client";
import { useState, useEffect, useRef } from "react";
import { Search, User, Building2, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Role = "candidate" | "recruiter" | "company";

interface SearchUser {
  _id?: string;
  name?: string;
  role?: Role | string; // allow unknown strings from backend
  phoneNum?: string;
  address?: string;
  avatar?: {
    url?: string;
  };
  position?: string;
}

interface SearchResult {
  success?: boolean;
  message?: string;
  data?: SearchUser[];
}

const safeLower = (v: unknown) =>
  typeof v === "string" ? v.toLowerCase() : "";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    const doSearch = async () => {
      const q = query.trim();
      if (!q) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      await searchUsers(q);
    };

    const id = setTimeout(doSearch, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchUsers = async (searchQuery: string) => {
    // cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_BASE_URL;
      if (!base) {
        console.error("Missing NEXT_PUBLIC_BASE_URL");
        setResults([]);
        setIsOpen(false);
        return;
      }

      const response = await fetch(`${base}/fetch/all/users`, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result: SearchResult = await response.json();

      if (result?.success && Array.isArray(result.data)) {
        const q = searchQuery.toLowerCase();
        const filteredResults = result.data.filter((user) => {
          if (!user) return false;
          const name = safeLower(user.name);
          const role = safeLower(user.role);
          const address = safeLower(user.address);
          const position = safeLower(user.position);
          return (
            name.includes(q) ||
            role.includes(q) ||
            address.includes(q) ||
            position.includes(q)
          );
        });

        const limited = filteredResults.slice(0, 8);
        setResults(limited);
        setIsOpen(limited.length > 0);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Search error:", err);
        setResults([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (user: SearchUser) => {
    const role = (user.role as Role) || "candidate";
    const id = user._id ?? "";
    const profileUrl =
      role === "company"
        ? `/companies-profile/${id}`
        : role === "recruiter"
        ? `/recruiters-profile/${id}`
        : `/candidates-profile/${id}`; // keep your existing route shape

    router.push(profileUrl);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSeeAllUsers = () => {
    const searchParam = query.trim() ? `?s=${encodeURIComponent(query)}` : "";
    router.push(`/all-users${searchParam}`);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "candidate":
        return <User className="h-4 w-4 text-green-600" />;
      case "recruiter":
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case "company":
        return <Building2 className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search people, companies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          aria-label="Global search"
          className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B98DE] focus:border-transparent transition-all duration-200 text-sm"
        />
        {isLoading && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="animate-spin h-4 w-4 border-2 border-[#4B98DE] border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search results"
        >
          {results.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </div>

              {results.map((user) => {
                const id = user._id ?? Math.random().toString(36).slice(2);
                const displayName = user?.name || "Unnamed";
                const firstLetter = (
                  user?.name?.charAt(0) || "U"
                ).toUpperCase();
                const avatarUrl =
                  user?.avatar?.url || "/placeholder.svg?height=40&width=40";

                return (
                  <Button
                    key={id}
                    variant="ghost"
                    className="w-full justify-start p-4 h-auto hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleResultClick(user)}
                    role="option"
                    aria-label={`Open profile for ${displayName}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="bg-[#4B98DE] text-white">
                          {firstLetter}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {displayName}
                          </span>
                          {getRoleIcon(user?.role as string | undefined)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user?.position ? (
                            <>
                              {user.position} • {user.address || "N/A"}
                            </>
                          ) : (
                            user?.address || "N/A"
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}

              <div className="px-4 py-3 text-center border-t bg-gray-50">
                <Button
                  variant="ghost"
                  className="text-[#4B98DE] hover:text-[#3a7bc8] text-sm font-medium"
                  onClick={handleSeeAllUsers}
                >
                  Show All Results
                </Button>
              </div>
            </>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search
                className="h-8 w-8 mx-auto mb-2 text-gray-300"
                aria-hidden
              />
              <p className="text-sm">
                No results found{query ? ` for "${query}"` : ""}.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for people, companies, or locations
              </p>
              <div className="mt-4">
                <Button
                  variant="ghost"
                  className="text-[#4B98DE] hover:text-[#3a7bc8] text-sm font-medium"
                  onClick={handleSeeAllUsers}
                >
                  Show All Results
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
