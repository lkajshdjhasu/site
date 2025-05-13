import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      publicKey: string;
      name: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    publicKey: string;
    name: string;
    image?: string;
  }
} 