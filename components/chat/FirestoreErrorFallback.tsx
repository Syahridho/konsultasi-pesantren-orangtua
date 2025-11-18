"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FirestoreErrorFallbackProps {
  onRetry?: () => void;
  message?: string;
}

export default function FirestoreErrorFallback({
  onRetry,
  message = "Koneksi ke database terganggu. Pastikan tidak ada ad blocker yang aktif dan coba lagi.",
}: FirestoreErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <CardTitle className="text-lg">Koneksi Bermasalah</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">{message}</p>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Solusi yang mungkin:</p>
            <ul className="text-xs text-gray-500 text-left space-y-1">
              <li>• Nonaktifkan ad blocker sementara</li>
              <li>• Periksa koneksi internet</li>
              <li>• Coba refresh halaman</li>
              <li>• Gunakan browser lain</li>
            </ul>
          </div>
          {onRetry && (
            <Button onClick={onRetry} className="w-full" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
