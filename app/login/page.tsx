"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setSuccessMessage(message);
    }

    // Handle error parameter from NextAuth
    const error = searchParams.get("error");
    if (error) {
      // Map NextAuth error codes to user-friendly messages
      const errorMessages: { [key: string]: string } = {
        CredentialsSignin: "Email atau password salah",
        AccessDenied: "Akses ditolak",
        Verification: "Verifikasi diperlukan",
        Default: "Terjadi kesalahan saat login",
      };
      setError(errorMessages[error] || errorMessages["Default"]);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Use the specific error message from NextAuth
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Masuk ke akun Anda untuk mengakses aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {successMessage && (
              <div className="text-green-500 text-sm">{successMessage}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memuat..." : "Login"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Lupa password?
            </Link>
          </div>
          <div className="mt-2 text-center text-sm">
            Belum punya akun?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Registrasi di sini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-center">Memuat...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
