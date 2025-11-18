"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/reset-password", { email });

      if (response.status === 200) {
        setSuccess(true);
      } else {
        setError(
          response.data.error ||
            "Terjadi kesalahan saat mengirim email reset password"
        );
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          "Terjadi kesalahan saat mengirim email reset password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lupa Password</CardTitle>
          <CardDescription>
            Masukkan email Anda untuk menerima link reset password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
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
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Mengirim..." : "Kirim Link Reset Password"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-green-600 text-sm">
                Email reset password telah dikirim ke {email}. Silakan periksa
                inbox Anda dan ikuti instruksi untuk reset password.
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Kembali ke Login
              </Button>
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            Ingat password Anda?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Kembali ke Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
