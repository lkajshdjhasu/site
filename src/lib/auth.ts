import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SigninMessage } from "@/lib/signin-message";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { sign } from "tweetnacl";
import { prisma } from "@/lib/prisma";
import type { User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { NextAuthConfig } from "next-auth";

// Auth options
const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET || "gizli-anahtar-buraya",
  debug: true,
  providers: [
    CredentialsProvider({
      name: "Solana",
      credentials: {
        message: {
          label: "Message",
          type: "text",
        },
        signature: {
          label: "Signature",
          type: "text",
        },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message || !credentials?.signature) {
            console.error("Eksik kimlik bilgileri");
            throw new Error("Missing credentials");
          }

          // Mesajı parse et
          let parsedMessage;
          try {
            parsedMessage = JSON.parse(credentials.message as string);
          } catch (e) {
            console.error("Mesaj parse hatası:", e);
            throw new Error("Invalid message format");
          }

          const signinMessage = new SigninMessage(parsedMessage);

          const publicKey = new PublicKey(signinMessage.publicKey);

          const signature = bs58.decode(credentials.signature as string);

          // İmzayı doğrula
          const messageBytes = new TextEncoder().encode(signinMessage.message);

          const isValid = sign.detached.verify(
            messageBytes,
            signature,
            publicKey.toBytes()
          );

          if (!isValid) {
            console.error("Geçersiz imza");
            throw new Error("Invalid signature");
          }

          const user = await prisma.user.upsert({
            where: {
              publicKey: publicKey.toString(),
            },
            update: {},
            create: {
              publicKey: publicKey.toString(),
              name: publicKey.toString(),
              image: `https://ui-avatars.com/api/?name=${publicKey.toString()}&background=random`,
            },
          });

          return {
            id: user.id,
            publicKey: user.publicKey,
            name: user.name,
            image: user.image || undefined,
          };
        } catch (e) {
          console.error("Authorization hatası:", e);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user = {
          id: token.sub as string,
          publicKey: token.publicKey as string,
          name: token.name as string,
          image: token.picture as string,
        } as any;
      }

      return session;
    },
    async jwt({ token, user }: { token: JWT; user: User | undefined }) {
      if (user) {
        token.publicKey = user.publicKey;
        token.name = user.name;
        token.picture = user.image;
      }

      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

// Next-Auth v5 için auth
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
