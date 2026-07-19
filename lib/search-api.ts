// Typed fetchers for the search endpoints. Every fetcher accepts the
// AbortSignal that react-query passes to queryFn ({ signal }) so superseded
// requests are cancelled automatically.

const BASE = process.env.NEXT_PUBLIC_BASE_URL;

export interface JobsSearchParams {
  q?: string;
  category?: string;
  locationType?: string;
  employmentType?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface JobsMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface JobsResponse {
  success: boolean;
  message: string;
  data: {
    meta: JobsMeta;
    jobs: any[];
  };
}

export interface SuggestionItem {
  value: string;
  count?: number;
  id?: string;
}

export interface JobSuggestionsResponse {
  success: boolean;
  message: string;
  data: {
    query: string;
    groups: {
      titles: SuggestionItem[];
      skills: SuggestionItem[];
      categories: SuggestionItem[];
      locations: SuggestionItem[];
    };
  };
}

export interface PeopleSearchParams {
  q?: string;
  role?: string;
  immediate?: boolean;
  page?: number;
  limit?: number;
}

export interface PersonResult {
  _id: string;
  name?: string;
  role?: string;
  slug?: string;
  address?: string;
  phoneNum?: string;
  avatar?: { url?: string | null };
  immediatelyAvailable?: boolean | null;
  position?: string | null;
  location?: string | null;
}

export interface PeopleResponse {
  success: boolean;
  message: string;
  data: {
    meta: JobsMeta;
    users: PersonResult[];
  };
}

export interface Category {
  _id: string;
  name: string;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: {
    category: Category[];
    meta?: JobsMeta;
  };
}

function requireBase(): string {
  if (!BASE) throw new Error("NEXT_PUBLIC_BASE_URL is not configured");
  return BASE;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

export function fetchJobs(
  params: JobsSearchParams,
  signal?: AbortSignal
): Promise<JobsResponse> {
  const url = new URL(`${requireBase()}/jobs`);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.locationType)
    url.searchParams.set("locationType", params.locationType);
  if (params.employmentType)
    url.searchParams.set("employmentType", params.employmentType);
  if (params.location) url.searchParams.set("location", params.location);
  url.searchParams.set("page", String(params.page || 1));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  return getJson<JobsResponse>(url.toString(), signal);
}

export function fetchJobSuggestions(
  q: string,
  signal?: AbortSignal
): Promise<JobSuggestionsResponse> {
  const url = new URL(`${requireBase()}/jobs/suggestions`);
  url.searchParams.set("q", q);
  return getJson<JobSuggestionsResponse>(url.toString(), signal);
}

export function fetchPeople(
  params: PeopleSearchParams,
  signal?: AbortSignal
): Promise<PeopleResponse> {
  const url = new URL(`${requireBase()}/search/people`);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.role) url.searchParams.set("role", params.role);
  if (params.immediate) url.searchParams.set("immediate", "1");
  url.searchParams.set("page", String(params.page || 1));
  url.searchParams.set("limit", String(params.limit || 12));
  return getJson<PeopleResponse>(url.toString(), signal);
}

export function fetchJobCategories(
  signal?: AbortSignal
): Promise<CategoriesResponse> {
  return getJson<CategoriesResponse>(
    `${requireBase()}/category/job-category`,
    signal
  );
}
