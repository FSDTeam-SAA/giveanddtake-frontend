"use client";
import { useState, useEffect, Suspense } from "react";
import {
  Search,
  User,
  Building2,
  UserCheck,
  MapPin,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchPeople, type PersonResult } from "@/lib/search-api";

const PAGE_SIZE = 12;
const ROLES = ["candidate", "recruiter", "company"];

function AllUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // URL params are the source of truth
  const s = searchParams.get("s") ?? "";
  const roleParam = searchParams.get("role") ?? "all";
  const role = ROLES.includes(roleParam) ? roleParam : "all";
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;
  const immediate = searchParams.get("immediate") === "1";

  // Local input state, debounced into the URL
  const [searchInput, setSearchInput] = useState(s);
  const debouncedInput = useDebounce(searchInput.trim(), 300);

  useEffect(() => {
    setSearchInput(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  useEffect(() => {
    if (debouncedInput === s) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedInput) params.set("s", debouncedInput);
    else params.delete("s");
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  const setParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Only an actual search returns results — we never list every user (and so
  // never reveal how many users exist).
  const hasSearch = s.trim().length > 0;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["all-users", { s, role, immediate, page }],
    queryFn: ({ signal }) =>
      fetchPeople(
        {
          q: s,
          role: role === "all" ? undefined : role,
          immediate,
          page,
          limit: PAGE_SIZE,
        },
        signal
      ),
    enabled: hasSearch,
    placeholderData: keepPreviousData,
  });

  const users = hasSearch ? data?.data?.users ?? [] : [];
  const meta = data?.data?.meta;

  const handleUserClick = (user?: PersonResult) => {
    if (!user) return;
    const userRole = user.role ?? "candidate";
    const id = user.slug;
    const profileUrl =
      userRole === "company"
        ? `/cmp/${id}`
        : userRole === "recruiter"
        ? `/rp/${id}`
        : `/cp/${id}`;
    router.push(profileUrl);
  };

  const getRoleIcon = (userRole?: string) => {
    switch (userRole) {
      case "candidate":
        return <User className="h-5 w-5 text-green-600" aria-hidden />;
      case "recruiter":
        return <UserCheck className="h-5 w-5 text-primary" aria-hidden />;
      case "company":
        return <Building2 className="h-5 w-5 text-purple-600" aria-hidden />;
      default:
        return <User className="h-5 w-5 text-gray-600" aria-hidden />;
    }
  };

  const hasActiveFilters = Boolean(s || role !== "all" || immediate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {hasSearch ? "Search Results" : "Find People & Companies"}
              </h1>
              <p className="text-gray-600 mt-1" aria-live="polite">
                {!hasSearch
                  ? "Search by name, role, skill or location to see results."
                  : isLoading
                  ? "Searching…"
                  : `Showing results for “${s}”`}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  maxLength={200}
                  className="pl-10 w-full sm:w-64 text-[16px] leading-5"
                  aria-label="Search users"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={role}
                  onValueChange={(v) =>
                    setParam({ role: v === "all" ? null : v, page: "1" })
                  }
                >
                  <SelectTrigger
                    className="w-[150px] bg-white"
                    aria-label="Filter by role"
                  >
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="candidate">Candidates</SelectItem>
                    <SelectItem value="recruiter">Recruiters</SelectItem>
                    <SelectItem value="company">Companies</SelectItem>
                  </SelectContent>
                </Select>

                {/* Immediate toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setParam({ immediate: immediate ? null : "1", page: "1" })
                  }
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border ${
                    immediate
                      ? "bg-green-50 border-green-300 text-green-800"
                      : "bg-white border-gray-200 text-gray-700"
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                  aria-pressed={immediate}
                >
                  {immediate ? (
                    <>
                      <CheckCircle className="h-4 w-4" aria-hidden />
                      Immediate only
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" aria-hidden />
                      Immediate (off)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasSearch ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start typing to search
            </h3>
            <p className="text-gray-600">
              Enter a name, role, skill or location to find people and companies.
            </p>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              Something went wrong while searching. Please try again.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {users.map((user) => (
                <Card
                  key={user._id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary hover:border-l-primary/80"
                  onClick={() => handleUserClick(user)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            user?.avatar?.url ||
                            "/placeholder.svg?height=48&width=48"
                          }
                          alt={user?.name ?? "User"}
                        />
                        <AvatarFallback className="bg-primary text-white font-semibold">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {user?.name ?? "Unknown"}
                          </h3>
                          <span className="shrink-0">
                            {getRoleIcon(user?.role)}
                          </span>
                        </div>

                        {user.role === "candidate" &&
                          user.immediatelyAvailable === true && (
                            <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-0.5 bg-green-50 text-green-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-600 inline-block" />
                              Immediately available
                            </span>
                          )}

                        <div className="space-y-2 text-sm text-gray-600 mt-2">
                          {user?.position && (
                            <div className="truncate font-medium text-gray-700">
                              {user.position}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {user?.location ||
                                user?.address ||
                                "No address available."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-primary border-primary hover:bg-primary hover:text-white transition-colors bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(user);
                        }}
                      >
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={meta.currentPage}
                  totalPages={meta.totalPages}
                  onPageChange={(nextPage) =>
                    setParam({ page: String(nextPage) })
                  }
                  isLoading={isFetching}
                  totalItems={meta.totalItems}
                  itemsPerPage={meta.itemsPerPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users match your search
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>

            {hasActiveFilters && (
              <Button
                onClick={() => {
                  setSearchInput("");
                  setParam({ s: null, role: null, immediate: null, page: "1" });
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AllUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-gray-600">Loading search params…</p>
          </div>
        </div>
      }
    >
      <AllUsersContent />
    </Suspense>
  );
}
