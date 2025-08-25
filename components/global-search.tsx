"use client";
import { useState, useEffect, useRef } from "react";
import { Search, User, Building2, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface SearchUser {
  _id: string;
  name: string;
  role: "candidate" | "recruiter" | "company";
  phoneNum: string;
  address: string;
  avatar: {
    url: string;
  };
}

interface SearchResult {
  success: boolean;
  message: string;
  data: SearchUser[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 0) {
        searchUsers(query);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown when clicking outside
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
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/fetch/all/users`
      );
      const result: SearchResult = await response.json();

      if (result.success) {
        // Filter results based on search query
        const filteredResults = result.data.filter(
          (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setResults(filteredResults.slice(0, 8)); // Limit to 8 results
        setIsOpen(filteredResults.length > 0);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (user: SearchUser) => {
    const profileUrl =
      user.role === "company"
        ? `/companies-profile/${user._id}`:
        user.role === "recruiter"
        ? `/recruiters-profile/${user._id}`
        : `/candidates-profile/${user._id}`;

    router.push(profileUrl);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSeeAllUsers = () => {
    router.push("/all-users");
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const getRoleIcon = (role: string) => {
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

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search people, companies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B98DE] focus:border-transparent transition-all duration-200 text-sm"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-[#4B98DE] border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </div>
              {results.map((user) => (
                <Button
                  key={user._id}
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleResultClick(user)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          user.avatar.url ||
                          "/placeholder.svg?height=40&width=40"
                        }
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-[#4B98DE] text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {user.name}
                        </span>
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getRoleLabel(user.role)} • {user.address}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
              <div className="px-4 py-3 text-center border-t bg-gray-50">
                <Button
                  variant="ghost"
                  className="text-[#4B98DE] hover:text-[#3a7bc8] text-sm font-medium"
                  onClick={handleSeeAllUsers}
                >
                  See all users
                </Button>
              </div>
            </>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for people, companies, or locations
              </p>
              <div className="mt-4">
                <Button
                  variant="ghost"
                  className="text-[#4B98DE] hover:text-[#3a7bc8] text-sm font-medium"
                  onClick={handleSeeAllUsers}
                >
                  See all users
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
