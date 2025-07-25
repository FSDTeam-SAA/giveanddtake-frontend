import { User } from "next-auth";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    role?: string;
  }

  interface Session {
    accessToken?: string;
    user: {
      image: string;
      id: string;
      email: string;
      name?: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: string;
    userId?: string;
  }
}
