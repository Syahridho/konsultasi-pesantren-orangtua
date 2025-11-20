"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Kesalahan Kritis
              </CardTitle>
              <CardDescription>
                Terjadi kesalahan kritis pada aplikasi. Silakan muat ulang
                halaman atau hubungi tim support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && (
                <div className="text-sm text-muted-foreground text-center">
                  <div className="p-2 bg-muted rounded text-xs text-left">
                    <p className="font-semibold">Error Detail (Development):</p>
                    <p className="text-destructive">{error.message}</p>
                    {error.digest && <p>Digest: {error.digest}</p>}
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang
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
      </body>
    </html>
  );
}
