"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ErrorBoundary,
  GenericErrorPage,
  ApiErrorHandler,
} from "@/components/error";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Example 1: Basic Error Boundary usage
export function BasicErrorBoundaryExample() {
  const [shouldError, setShouldError] = useState(false);

  const ComponentThatMightError = () => {
    if (shouldError) {
      throw new Error("Contoh error dalam komponen");
    }
    return (
      <div className="p-4 bg-green-100 rounded">Komponen berfungsi normal</div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Error Boundary Example</CardTitle>
        <CardDescription>
          Contoh penggunaan Error Boundary untuk menangkap error di komponen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => setShouldError(!shouldError)}
          variant={shouldError ? "destructive" : "default"}
        >
          {shouldError ? "Perbaiki Komponen" : "Trigger Error"}
        </Button>

        <ErrorBoundary>
          <ComponentThatMightError />
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}

// Example 2: API Error Handler usage
export function ApiErrorExample() {
  const [error, setError] = useState<{
    message: string;
    status?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const simulateApiCall = async () => {
    setLoading(true);
    setError(null);

    // Simulate API call with potential error
    setTimeout(() => {
      const shouldFail = Math.random() > 0.5;
      if (shouldFail) {
        setError({
          message: "Gagal mengambil data dari server. Status: 500",
          status: 500,
        });
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">API Error Handler Example</CardTitle>
        <CardDescription>
          Contoh penggunaan ApiErrorHandler untuk menangani error dari API calls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={simulateApiCall} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Memuat...
            </>
          ) : (
            "Simulasi API Call"
          )}
        </Button>

        {error && (
          <ApiErrorHandler
            error={error}
            onRetry={simulateApiCall}
            showInline={true}
          />
        )}

        {!error && !loading && (
          <div className="p-4 bg-blue-50 rounded text-sm">
            Klik tombol di atas untuk mensimulasikan API call (50% kemungkinan
            error)
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example 3: Generic Error Page with different status codes
export function GenericErrorExamples() {
  const [selectedError, setSelectedError] = useState<number | null>(null);

  const errorExamples = [
    { code: 400, title: "Bad Request" },
    { code: 401, title: "Unauthorized" },
    { code: 403, title: "Forbidden" },
    { code: 404, title: "Not Found" },
    { code: 500, title: "Server Error" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generic Error Page Examples</CardTitle>
        <CardDescription>
          Contoh penggunaan GenericErrorPage untuk berbagai status codes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {errorExamples.map((error) => (
            <Button
              key={error.code}
              variant={selectedError === error.code ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedError(error.code)}
            >
              {error.code}
            </Button>
          ))}
        </div>

        {selectedError && (
          <div className="border rounded-lg p-4">
            <GenericErrorPage
              statusCode={selectedError}
              showRetry={true}
              onRetry={() => setSelectedError(null)}
              inline={true}
            />
          </div>
        )}

        {!selectedError && (
          <div className="p-4 bg-gray-50 rounded text-sm text-center">
            Pilih status code di atas untuk melihat contoh halaman error
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example 4: Custom Error Fallback
export function CustomErrorFallbackExample() {
  const [shouldError, setShouldError] = useState(false);

  const CustomErrorFallback = () => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 text-red-800">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-semibold">Custom Error Fallback</span>
      </div>
      <p className="text-sm text-red-600 mt-2">
        Ini adalah custom error fallback yang diberikan ke ErrorBoundary
      </p>
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => setShouldError(false)}
      >
        Reset
      </Button>
    </div>
  );

  const ComponentThatMightError = () => {
    if (shouldError) {
      throw new Error("Error dengan custom fallback");
    }
    return (
      <div className="p-4 bg-green-100 rounded">Komponen berfungsi normal</div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Custom Error Fallback Example</CardTitle>
        <CardDescription>
          Contoh penggunaan ErrorBoundary dengan custom fallback component
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => setShouldError(!shouldError)}
          variant={shouldError ? "destructive" : "default"}
        >
          {shouldError ? "Reset Error" : "Trigger Error"}
        </Button>

        <ErrorBoundary fallback={<CustomErrorFallback />}>
          <ComponentThatMightError />
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}
