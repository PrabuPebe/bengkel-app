import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const hasGoogleCredentials =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
  !["PASTE_GOOGLE_CLIENT_ID_HERE", "Client_ID_asli_dari_Google", "nilai_asli_dari_google"].includes(process.env.GOOGLE_CLIENT_ID ?? "") &&
  !["PASTE_GOOGLE_CLIENT_SECRET_HERE", "Client_Secret_asli_dari_Google", "nilai_asli_dari_google"].includes(process.env.GOOGLE_CLIENT_SECRET ?? "");

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Email dan password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const inputUser = (credentials?.email || "").trim().toLowerCase();
        const inputPass = (credentials?.password || "").trim();

        const validEmail = (process.env.LOGIN_EMAIL || "admin22@gmail.com").trim().toLowerCase();
        const validPass = (process.env.LOGIN_PASSWORD || "mamang22").trim();
        const validUsername = validEmail.split("@")[0]; // "admin22"

        // Izinkan login dengan email lengkap, username "admin22", atau "admin"
        const isUserValid =
          inputUser === validEmail ||
          inputUser === validUsername ||
          inputUser === "admin";

        const isPassValid = inputPass === validPass;

        if (!isUserValid || !isPassValid) {
          return null;
        }

        return {
          id: validEmail,
          email: validEmail,
          name: validUsername,
        };
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
  secret: process.env.NEXTAUTH_SECRET || "rahasia_bengkel_super_aman_123",
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export { handler as GET, handler as POST };