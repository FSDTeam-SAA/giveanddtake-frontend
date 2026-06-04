import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

/**
 * Reads the logged-in user's access token on the server (route handlers,
 * server actions, RSC). Returns null when there is no authenticated session.
 */
export async function getServerAccessToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.accessToken ?? null;
}

/**
 * Builds the headers a proxy route should forward to the backend, including
 * the Bearer token of the current session when present. Merge extra headers
 * (e.g. Content-Type) via the argument.
 */
export async function getBackendHeaders(
  extra: Record<string, string> = {}
): Promise<Record<string, string>> {
  const token = await getServerAccessToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
