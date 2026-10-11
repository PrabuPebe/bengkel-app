import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

const hasGoogleCredentials =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
  !["PASTE_GOOGLE_CLIENT_ID_HERE", "Client_ID_asli_dari_Google", "nilai_asli_dari_google"].includes(process.env.GOOGLE_CLIENT_ID ?? "") &&
  !["PASTE_GOOGLE_CLIENT_SECRET_HERE", "Client_Secret_asli_dari_Google", "nilai_asli_dari_google"].includes(process.env.GOOGLE_CLIENT_SECRET ?? "");

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Staf PitCare Auto",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const inputUser = (credentials?.email || "").trim().toLowerCase();
        const inputPass = (credentials?.password || "").trim();

        // 1. Root admin fallback (demo / offline resilient)
        const validEmail = (process.env.LOGIN_EMAIL || "admin22@gmail.com").trim().toLowerCase();
        const validPass = (process.env.LOGIN_PASSWORD || "mamang22").trim();
        const validUsername = validEmail.split("@")[0]; // "admin22"

        if (
          (inputUser === validEmail || inputUser === validUsername || inputUser === "admin") &&
          inputPass === validPass
        ) {
          return {
            id: "usr-root-admin",
            name: "Pak Joko (Admin)",
            email: validEmail,
            role: "ADMIN",
          };
        }

        // 2. Query Supabase users table via Prisma
        try {
          const user = await prisma.user.findUnique({
            where: { email: inputUser },
          });

          if (user && user.password && user.password === inputPass) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        } catch (err) {
          console.error("NextAuth authorize Supabase error:", err);
        }

        // 3. Fallback: Staff Mekanik & Demo (Budi Santoso) / In-Memory Resilient
        if (
          (inputUser === "mekanik@pitcare.auto" || inputUser === "budi@pitcare.auto" || inputUser === "mekanik") &&
          (inputPass === "pitcare123" || inputPass === "mamang22" || inputPass === "password")
        ) {
          return {
            id: "usr-3",
            name: "Budi Santoso",
            email: "mekanik@pitcare.auto",
            role: "MECHANIC",
          };
        }

        if (
          (inputUser === "agus@pitcare.auto" || inputUser === "agus") &&
          (inputPass === "pitcare123" || inputPass === "mamang22" || inputPass === "password")
        ) {
          return {
            id: "usr-4",
            name: "Agus Pratama",
            email: "agus@pitcare.auto",
            role: "MECHANIC",
          };
        }

        if (
          (inputUser === "kasir@pitcare.auto" || inputUser === "kasir") &&
          (inputPass === "pitcare123" || inputPass === "mamang22" || inputPass === "password")
        ) {
          return {
            id: "usr-2",
            name: "Siti Rahma",
            email: "kasir@pitcare.auto",
            role: "CASHIER",
          };
        }

        return null;
      },
    }),
    ...(hasGoogleCredentials
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "ADMIN";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role || "ADMIN";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "rahasia_bengkel_super_aman_123",
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
