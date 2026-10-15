import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { decode as decodeJwt, encode as encodeJwt } from 'next-auth/jwt';

const LONG_SESSION = 30 * 24 * 60 * 60;
const accessExpiry = (value?: string) => {
  try { return JSON.parse(Buffer.from(value!.split('.')[1], 'base64url').toString()).exp * 1000; }
  catch { return 0; }
};

// Several parallel requests can ask NextAuth to refresh the same token.
const refreshes = new Map<string, Promise<any>>();
const refreshAccess = (token: any) => {
  const key = token.refreshToken as string;
  if (!refreshes.has(key)) {
    const task = (async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/refresh-token`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: key }), cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (response.status >= 500) return { ...token, error: 'RefreshUnavailable' };
        return { ...token, accessToken: undefined, error: 'SessionExpired' };
      }
      return { ...token, accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        accessExpiresAt: accessExpiry(result.data.accessToken), error: undefined };
    })().catch(() => ({ ...token, error: 'RefreshUnavailable' })).finally(() => { refreshes.delete(key); });
    refreshes.set(key, task);
  }
  return refreshes.get(key)!;
};

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: 'Remember me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/user/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email.trim().toLowerCase(),
                password: credentials.password,
                rememberMe: credentials.rememberMe === 'true',
              }),
            }
          );

          let data: any = null;
          try {
            data = await response.json();
          } catch {
            data = null;
          }

          if (!response.ok || !data?.success) {
            const message =
              data?.message ||
              (response.status === 401 || response.status === 403
                ? "Invalid email or password"
                : "Unable to sign in");
            const nextStep = data?.data?.nextStep;
            const errorPayload = {
              message,
              code: nextStep === "verify-otp" ? "UNVERIFIED" : "LOGIN_FAILED",
              status: response.status,
              email: data?.data?.email ?? credentials.email,
              nextStep: nextStep ?? null,
              needsSecurityQuestions:
                data?.data?.needsSecurityQuestions ?? false,
            };
            throw new Error(JSON.stringify(errorPayload));
          }

          if (response.ok && data.success) {
            const userData = data.data ?? {};

            // plan fields might be absent
            const plan = userData.plan ?? null;
            const planId = plan?._id ?? null;
            const planTitle = plan?.title ?? null;
            const planValid = plan?.valid ?? null;

            return {
              id: userData._id,
              // prefer API email (fallback to typed email)
              email: userData.email ?? credentials.email,
              name:
                userData.name ??
                (userData.email ?? credentials.email).split("@")[0],
              accessToken: userData.accessToken,
              refreshToken: userData.refreshToken,
              sessionExpiresAt: userData.sessionExpiresAt * 1000 ||
                Date.now() + (credentials.rememberMe === 'true' ? LONG_SESSION : 12 * 60 * 60) * 1000,

              role: userData.role,
              isValid: userData.isValid ?? false,
              payAsYouGo: userData.payAsYouGo ?? false,

              // NEW: normalize extra profile fields into the user object
              phoneNumber: userData.phoneNum ?? null, // API field: phoneNum
              country: userData.address ?? null, // API field: address → country

              // plan (optional)
              planId,
              planTitle,
              planValid,

              // refreshToken: userData.refreshToken, // optional if you need it later
            };
          }
          return null;
        } catch (error) {
          console.error("Login error:", error);
          const fallbackMessage =
            error instanceof Error ? error.message : "Unable to sign in";
          throw new Error(fallbackMessage);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.sessionExpiresAt = (user as any).sessionExpiresAt;
        token.accessExpiresAt = accessExpiry(token.accessToken as string);
        token.role = user.role;
        token.userId = user.id;
        token.isValid = (user as any).isValid;
        token.payAsYouGo = (user as any).payAsYouGo;

        // propagate new profile fields
        token.phoneNumber = (user as any).phoneNumber ?? null;
        token.country = (user as any).country ?? null;

        // plan fields (may be null)
        token.planId = (user as any).planId ?? null;
        token.planTitle = (user as any).planTitle ?? null;
        token.planValid = (user as any).planValid ?? null;
      }
      if (Date.now() >= Number(token.sessionExpiresAt || Number(token.exp) * 1000)) {
        return { ...token, accessToken: undefined, error: 'SessionExpired' };
      }
      if (Date.now() >= Number(token.accessExpiresAt || 0) - 60_000) {
        return token.refreshToken ? refreshAccess(token) : { ...token, accessToken: undefined, error: 'SessionExpired' };
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error as string | undefined;
      session.sessionExpiresAt = token.sessionExpiresAt as number;
      session.user.role = token.role as string | undefined;
      session.user.id = token.userId as string;

      // flags
      (session.user as typeof session.user & { isValid?: boolean }).isValid =
        (token.isValid as boolean | undefined) ?? false;

      (
        session.user as typeof session.user & { payAsYouGo?: boolean }
      ).payAsYouGo = (token.payAsYouGo as boolean | undefined) ?? false;

      // NEW: expose to client session
      (
        session.user as typeof session.user & { phoneNumber?: string | null }
      ).phoneNumber = (token.phoneNumber as string | null) ?? null;

      (
        session.user as typeof session.user & { country?: string | null }
      ).country = (token.country as string | null) ?? null;

      // plan (keep optional and null-safe)
      (
        session.user as typeof session.user & { planId?: string | null }
      ).planId = (token.planId as string | null) ?? null;
      (
        session.user as typeof session.user & { planTitle?: string | null }
      ).planTitle = (token.planTitle as string | null) ?? null;
      (
        session.user as typeof session.user & { planValid?: string | null }
      ).planValid = (token.planValid as string | null) ?? null;

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: LONG_SESSION,
  },
  jwt: {
    encode: async (params) => encodeJwt({ ...params,
      maxAge: Math.max(1, Math.floor((Number(params.token?.sessionExpiresAt || Date.now() + LONG_SESSION * 1000) - Date.now()) / 1000)),
    }),
    decode: decodeJwt,
  },
});

export { handler as GET, handler as POST };
