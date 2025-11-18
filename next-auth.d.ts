import NextAuth, { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// Perluas tipe User untuk memasukkan role
interface CustomUser {
  id?: string;
  role?: "admin" | "ustad" | "orangtua"; // Role yang Anda definisikan
}

// 1. Perluas tipe Session untuk user
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & CustomUser;
  }

  interface User extends CustomUser {}
}

// 2. Perluas tipe JWT
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: "admin" | "ustad" | "orangtua";
  }
}
