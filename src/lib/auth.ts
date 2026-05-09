import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        const valid = await verifyPassword(credentials.password, user.password);

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          planType: user.planType,
          subscriberLimit: user.subscriberLimit,
          emailVerified: Boolean(user.emailVerifiedAt),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.planType = user.planType;
        token.subscriberLimit = user.subscriberLimit;
        token.emailVerified = Boolean((user as { emailVerified?: boolean | Date | null }).emailVerified);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.planType = token.planType;
        session.user.subscriberLimit = token.subscriberLimit;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
