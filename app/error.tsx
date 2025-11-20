"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">
            500 - Kesalahan Server
          </CardTitle>
          <CardDescription>
            Terjadi kesalahan tak terduga pada server kami. Tim kami telah
            diberitahu tentang masalah ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>Anda dapat mencoba:</p>
            <ul className="mt-2 space-y-1">
              <li>• Memuat ulang halaman</li>
              <li>• Kembali ke halaman sebelumnya</li>
              <li>• Mengunjungi halaman utama</li>
            </ul>
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-2 bg-muted rounded text-xs text-left">
                <p className="font-semibold">Error Detail (Development):</p>
                <p className="text-destructive">{error.message}</p>
                {error.digest && <p>Digest: {error.digest}</p>}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Beranda
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
