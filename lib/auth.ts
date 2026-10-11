import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { db } from "./db";

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

        if (!inputUser || !inputPass) return null;

        // 1. Query Supabase users table via Prisma
        try {
          const user = await prisma.user.findUnique({
            where: { email: inputUser },
            include: { workshop: true },
          });

          if (user && user.password && user.password === inputPass) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              workshopId: user.workshopId || null,
              workshopName: user.workshop?.name || "PitCare Auto",
            };
          }
        } catch (err) {
          console.error("NextAuth authorize Supabase error:", err);
        }

        // 2. In-Memory Resilient Store (Akun baru terdaftar saat offline / database paus)
        const memoryUsers = await db.user.findMany();
        const matched = memoryUsers.find((u) => u.email.toLowerCase() === inputUser);
        if (matched) {
          const workshop = matched.workshopId ? await db.workshop.findById(matched.workshopId) : null;
          return {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            role: matched.role,
            workshopId: matched.workshopId || null,
            workshopName: workshop?.name || "PitCare Auto Pusat",
          };
        }

        // 3. Root Owner fallback (jika disetel lewat environment variable)
        const validEmail = (process.env.LOGIN_EMAIL || "admin22@gmail.com").trim().toLowerCase();
        const validPass = (process.env.LOGIN_PASSWORD || "mamang22").trim();
        if (inputUser === validEmail && inputPass === validPass) {
          return {
            id: "usr-root-admin",
            name: "Admin Pusat",
            email: validEmail,
            role: "OWNER",
            workshopId: "ws-default",
            workshopName: "PitCare Auto Pusat",
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
        token.workshopId = (user as any).workshopId || null;
        token.workshopName = (user as any).workshopName || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role || "ADMIN";
        (session.user as any).workshopId = token.workshopId || null;
        (session.user as any).workshopName = token.workshopName || null;
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
