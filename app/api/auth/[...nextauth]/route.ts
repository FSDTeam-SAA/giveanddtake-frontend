import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data.success) {
            const userData = data.data;
            return {
              id: userData._id,
              email: credentials.email,
              name: credentials.email.split("@")[0],
              accessToken: userData.accessToken,

              role: userData.role,
              isValid: userData.isValid, // ⬅️ new
              payAsYouGo: userData.payAsYouGo,
              // refreshToken: userData.refreshToken, // (optional) add if you want it later
            };
          }
          return null;
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.userId = user.id;
        token.isValid = user.isValid; // ⬅️ new
        token.payAsYouGo = user.payAsYouGo; // ⬅️ Add payAsYouGo to token
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.user.role = token.role as string | undefined;
      session.user.id = token.userId as string;
      // make isValid available on the client session
      (session.user as typeof session.user & { isValid?: boolean }).isValid =
        token.isValid as boolean | undefined;
      (
        session.user as typeof session.user & { payAsYouGo?: boolean }
      ).payAsYouGo = token.payAsYouGo as boolean | undefined; // ⬅️ Add payAsYouGo to session
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
