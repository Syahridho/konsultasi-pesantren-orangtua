"use client";

import { useEffect, useState } from "react";
import GenericErrorPage from "./generic-error-page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ApiErrorHandlerProps {
  error: Error | { message: string; status?: number } | null;
  onRetry?: () => void;
  showInline?: boolean;
  customMessage?: string;
}

export default function ApiErrorHandler({
  error,
  onRetry,
  showInline = false,
  customMessage,
}: ApiErrorHandlerProps) {
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (error) {
      console.error("API Error:", error);
    }
  }, [error]);

  if (!error) return null;

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    if (onRetry) {
      onRetry();
    }
  };

  const getStatusFromError = () => {
    if ("status" in error && error.status) {
      return error.status;
    }

    // Try to extract status from message if it's a network error
    const message = error.message.toLowerCase();
    if (message.includes("unauthorized") || message.includes("401")) return 401;
    if (message.includes("forbidden") || message.includes("403")) return 403;
    if (message.includes("not found") || message.includes("404")) return 404;
    if (message.includes("timeout") || message.includes("408")) return 408;
    if (message.includes("too many") || message.includes("429")) return 429;
    if (message.includes("server error") || message.includes("500")) return 500;
    if (message.includes("service unavailable") || message.includes("503"))
      return 503;

    return 500;
  };

  if (showInline) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Kesalahan
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm">
            {customMessage ||
              error.message ||
              "Terjadi kesalahan saat memuat data."}
          </CardDescription>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-2"
              disabled={retryCount >= 3}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Coba Lagi {retryCount > 0 && `(${retryCount}/3)`}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <GenericErrorPage
      statusCode={getStatusFromError()}
      description={
        customMessage ||
        error.message ||
        "Terjadi kesalahan saat menghubungi server."
      }
      showRetry={!!onRetry && retryCount < 3}
      onRetry={handleRetry}
    />
  );
}
