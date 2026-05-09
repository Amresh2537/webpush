import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      planType: "FREE" | "PRO";
      subscriberLimit: number;
      emailVerified: boolean;
    };
  }

  interface User {
    id: string;
    planType: "FREE" | "PRO";
    subscriberLimit: number;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    planType: "FREE" | "PRO";
    subscriberLimit: number;
    emailVerified: boolean;
  }
}
