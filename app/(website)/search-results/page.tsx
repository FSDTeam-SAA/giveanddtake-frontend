"use client";
import { useState, useEffect } from "react";
import type React from "react";

import { useSearchParams } from "next/navigation";
import {
  Search,
  User,
  Building2,
  UserCheck,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  useEffect(() => {
    if (query) {
      searchUsers(query);
    }
  }, [query]);

  useEffect(() => {
    applyFilters();
  }, [results, roleFilter, locationFilter]);

  const searchUsers = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/fetch/all/users`
      );
      const result: SearchResult = await response.json();

      if (result.success) {
        // Enhanced search with multiple criteria
        const filteredResults = result.data.filter((user) => {
          const searchTerm = searchQuery.toLowerCase();
          return (
            user.name.toLowerCase().includes(searchTerm) ||
            user.role.toLowerCase().includes(searchTerm) ||
            user.address.toLowerCase().includes(searchTerm) ||
            user.phoneNum.includes(searchTerm) ||
            user.name
              .toLowerCase()
              .split(" ")
              .some((word) => word.startsWith(searchTerm)) ||
            user.address
              .toLowerCase()
              .split(" ")
              .some((word) => word.startsWith(searchTerm))
          );
        });

        setResults(filteredResults);

        // Extract unique locations for filter
        const locations = [
          ...new Set(filteredResults.map((user) => user.address)),
        ];
        setAvailableLocations(locations);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter((user) => user.address === locationFilter);
    }

    setFilteredResults(filtered);
  };

  const handleResultClick = (user: SearchUser) => {
    const profileUrl =
      user.role === "company"
        ? `/companies-profile/${user._id}`
        : user.role === "recruiter"
        ? `/recruiters-profile/${user._id}`
        : `/candidates-profile/${user._id}`;

    router.push(profileUrl);
  };

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchUsers(query.trim());
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "candidate":
        return <User className="h-5 w-5 text-green-600" />;
      case "recruiter":
        return <UserCheck className="h-5 w-5 text-blue-600" />;
      case "company":
        return <Building2 className="h-5 w-5 text-purple-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "candidate":
        return "bg-green-100 text-green-800";
      case "recruiter":
        return "bg-blue-100 text-blue-800";
      case "company":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
          </div>

          {/* Search Form */}
          <form onSubmit={handleNewSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search people, companies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">
              {filteredResults.length} result
              {filteredResults.length !== 1 ? "s" : ""} found
            </span>
            {query && (
              <span>
                for "<span className="font-medium text-gray-900">{query}</span>"
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="candidate">Candidate</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {availableLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-[#4B98DE] border-t-transparent rounded-full"></div>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleResultClick(user)}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={
                        user.avatar.url || "/placeholder.svg?height=64&width=64"
                      }
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-[#4B98DE] text-white text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.name}
                      </h3>
                      {getRoleIcon(user.role)}
                    </div>

                    <div className="space-y-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>

                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span>📍</span>
                        {user.address}
                      </p>

                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span>📞</span>
                        {user.phoneNum}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setRoleFilter("all");
                setLocationFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
