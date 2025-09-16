import { User as NextAuthUser } from "next-auth";

declare module "next-auth" {
  interface User extends NextAuthUser {
    accessToken?: string;
    role?: string;
    isValid?: boolean; // ⬅️ new
    payAsYouGo?: boolean;
  }

  interface Session {
    accessToken?: string;
    user: {
      image: string; // (you already require this elsewhere)
      id: string;
      email: string;
      name?: string;
      role?: string;
      payAsYouGo?: boolean;
      isValid?: boolean; // ⬅️ new
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: string;
    userId?: string;
    isValid?: boolean; // ⬅️ new
    payAsYouGo?: boolean;
  }
}
