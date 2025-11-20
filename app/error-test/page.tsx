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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Bug, RefreshCw } from "lucide-react";

// Component that throws an error for testing
function ErrorComponent({ shouldError }: { shouldError: boolean }) {
  if (shouldError) {
    throw new Error("Ini adalah error test untuk demonstrasi Error Boundary");
  }
  return (
    <div className="p-4 bg-green-100 rounded">Komponen berfungsi normal</div>
  );
}

// Component that simulates API error
function ApiErrorComponent() {
  const [error, setError] = useState<{
    message: string;
    status?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const simulateApiError = () => {
    setLoading(true);
    setTimeout(() => {
      setError({
        message:
          "Gagal menghubungi server. Silakan periksa koneksi internet Anda.",
        status: 503,
      });
      setLoading(false);
    }, 1000);
  };

  const resetError = () => {
    setError(null);
  };

  return (
    <div className="space-y-4">
      <Button onClick={simulateApiError} disabled={loading} className="w-full">
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Memuat...
          </>
        ) : (
          <>
            <Bug className="w-4 h-4 mr-2" />
            Simulasi API Error
          </>
        )}
      </Button>

      {error && (
        <ApiErrorHandler error={error} onRetry={resetError} showInline={true} />
      )}
    </div>
  );
}

export default function ErrorTestPage() {
  const [showErrorBoundary, setShowErrorBoundary] = useState(false);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Halaman Test Error Handling
            </CardTitle>
            <CardDescription>
              Halaman ini digunakan untuk testing semua komponen error handling
              yang telah dibuat.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="notfound" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notfound">404</TabsTrigger>
            <TabsTrigger value="server">500</TabsTrigger>
            <TabsTrigger value="boundary">Error Boundary</TabsTrigger>
            <TabsTrigger value="api">API Error</TabsTrigger>
          </TabsList>

          <TabsContent value="notfound">
            <Card>
              <CardHeader>
                <CardTitle>Error 404 - Not Found</CardTitle>
                <CardDescription>
                  Komponen ini ditampilkan ketika halaman tidak ditemukan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GenericErrorPage
                  statusCode={404}
                  showRetry={false}
                  inline={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="server">
            <Card>
              <CardHeader>
                <CardTitle>Error 500 - Server Error</CardTitle>
                <CardDescription>
                  Komponen ini ditampilkan ketika terjadi error di server.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GenericErrorPage
                  statusCode={500}
                  showRetry={true}
                  onRetry={() => window.location.reload()}
                  inline={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boundary">
            <Card>
              <CardHeader>
                <CardTitle>React Error Boundary</CardTitle>
                <CardDescription>
                  Komponen ini menangkap error yang terjadi di React components.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowErrorBoundary(!showErrorBoundary)}
                  variant={showErrorBoundary ? "destructive" : "default"}
                >
                  {showErrorBoundary ? "Sembunyikan Error" : "Tampilkan Error"}
                </Button>

                {showErrorBoundary && (
                  <ErrorBoundary
                    onError={(error, errorInfo) => {
                      console.error(
                        "ErrorBoundary caught an error:",
                        error,
                        errorInfo
                      );
                    }}
                  >
                    <ErrorComponent shouldError={true} />
                  </ErrorBoundary>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Error Handler</CardTitle>
                <CardDescription>
                  Komponen ini menangani error dari API calls.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiErrorComponent />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Cara Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>404 Error:</strong> Kunjungi URL yang tidak ada,
                misalnya /halaman-tidak-ada
              </li>
              <li>
                <strong>500 Error:</strong> Lihat tab "Server Error" di atas
              </li>
              <li>
                <strong>Error Boundary:</strong> Klik tombol "Tampilkan Error"
                di tab "Error Boundary"
              </li>
              <li>
                <strong>API Error:</strong> Klik tombol "Simulasi API Error" di
                tab "API Error"
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
