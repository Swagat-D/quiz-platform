import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique identifier */
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** Flag to indicate if the user's email is verified */
      emailVerified: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's unique identifier */
    id: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
    /** Flag to indicate if the user's email is verified */
    emailVerified: boolean;
  }
}