import { User as NextAuthUser } from "next-auth";

declare module "next-auth" {
  interface User extends NextAuthUser {
    accessToken?: string;
    role?: string;
    isValid?: boolean;
    payAsYouGo?: boolean;

    // NEW
    phoneNumber?: string | null;
    country?: string | null;

    // plan (optional – may be null when API returns no plan)
    planId?: string | null;
    planTitle?: string | null;
    planValid?: string | null;
  }

  interface Session {
    error?: string;
    sessionExpiresAt?: number;
    accessToken?: string;
    user: {
      image: string; // you mentioned you require this elsewhere
      id: string;
      email: string;
      name?: string;
      role?: string;

      isValid?: boolean;
      payAsYouGo?: boolean;

      // NEW
      phoneNumber?: string | null;
      country?: string | null;

      // plan (optional)
      planId?: string | null;
      planTitle?: string | null;
      planValid?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    error?: string;
    refreshToken?: string;
    sessionExpiresAt?: number;
    accessExpiresAt?: number;
    accessToken?: string;
    role?: string;
    userId?: string;

    isValid?: boolean;
    payAsYouGo?: boolean;

    // NEW
    phoneNumber?: string | null;
    country?: string | null;

    // plan (optional)
    planId?: string | null;
    planTitle?: string | null;
    planValid?: string | null;
  }
}
