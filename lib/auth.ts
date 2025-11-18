import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { authenticateUser } from "./firebase-auth";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Kredensial",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) {
          throw new Error("Email dan password harus diisi");
        }

        try {
          // Authenticate with Firebase
          const user = await authenticateUser(email, password);

          if (user) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }

          return null;
        } catch (error: any) {
          console.error("Authentication error:", error);

          // Return specific error messages based on Firebase error codes
          if (error.code === "auth/user-not-found") {
            throw new Error("Pengguna tidak ditemukan");
          } else if (error.code === "auth/wrong-password") {
            throw new Error("Password salah");
          } else if (error.code === "auth/invalid-credential") {
            throw new Error("Email atau password tidak valid");
          } else if (error.code === "auth/too-many-requests") {
            throw new Error(
              "Terlalu banyak percobaan login. Silakan coba lagi beberapa saat"
            );
          } else {
            throw new Error("Terjadi kesalahan saat login. Silakan coba lagi");
          }
        }
      },
    }),
  ],

  // --- Penambahan Callbacks ---
  callbacks: {
    // 1. Memperbarui JWT dengan data role
    async jwt({ token, user }: { token: JWT; user?: any }) {
      // Jika user ada (hanya saat login pertama), tambahkan role ke token
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },

    // 2. Memperbarui objek session untuk Client Component
    async session({ session, token }: { session: Session; token: JWT }) {
      // Tambahkan role dari token ke objek session
      if (token.role && session.user) {
        session.user.role = token.role as "admin" | "ustad" | "orangtua";
      }
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // Pastikan Anda menggunakan strategi JWT jika menggunakan callback ini
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // Add error handling
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
