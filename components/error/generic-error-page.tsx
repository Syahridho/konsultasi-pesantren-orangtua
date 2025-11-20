import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

interface GenericErrorPageProps {
  statusCode?: number;
  title?: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  customIcon?: React.ReactNode;
  inline?: boolean; // New prop to control layout
}

const errorMessages: Record<number, { title: string; description: string }> = {
  400: {
    title: "400 - Permintaan Tidak Valid",
    description:
      "Permintaan yang Anda kirim tidak valid atau mengandung kesalahan.",
  },
  401: {
    title: "401 - Tidak Diautorisasi",
    description: "Anda perlu masuk untuk mengakses halaman ini.",
  },
  403: {
    title: "403 - Akses Ditolak",
    description: "Anda tidak memiliki izin untuk mengakses halaman ini.",
  },
  408: {
    title: "408 - Permintaan Timeout",
    description:
      "Server membutuhkan waktu terlalu lama untuk merespons permintaan Anda.",
  },
  409: {
    title: "409 - Konflik",
    description: "Terjadi konflik dengan status saat ini dari sumber daya.",
  },
  422: {
    title: "422 - Entitas Tidak Dapat Diproses",
    description:
      "Server memahami permintaan Anda tetapi tidak dapat memprosesnya.",
  },
  429: {
    title: "429 - Terlalu Banyak Permintaan",
    description:
      "Anda telah mengirim terlalu banyak permintaan dalam waktu singkat.",
  },
  500: {
    title: "500 - Kesalahan Server Internal",
    description: "Terjadi kesalahan tak terduga pada server kami.",
  },
  502: {
    title: "502 - Gateway Buruk",
    description: "Server menerima respons yang tidak valid dari server hulu.",
  },
  503: {
    title: "503 - Layanan Tidak Tersedia",
    description: "Server saat ini tidak dapat menangani permintaan Anda.",
  },
  504: {
    title: "504 - Gateway Timeout",
    description:
      "Server bertindak sebagai gateway atau proxy dan tidak menerima respons tepat waktu.",
  },
};

export default function GenericErrorPage({
  statusCode = 500,
  title,
  description,
  showRetry = false,
  onRetry,
  customIcon,
  inline = false, // Default to false for backward compatibility
}: GenericErrorPageProps) {
  const errorInfo = errorMessages[statusCode] || {
    title: `${statusCode} - Kesalahan`,
    description: "Terjadi kesalahan yang tidak diketahui.",
  };

  const displayTitle = title || errorInfo.title;
  const displayDescription = description || errorInfo.description;

  const containerClasses = inline
    ? "flex items-center justify-center p-4"
    : "min-h-screen flex items-center justify-center bg-background p-4";

  return (
    <div className={containerClasses}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            {customIcon || (
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">{displayTitle}</CardTitle>
          <CardDescription>{displayDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>Anda dapat mencoba:</p>
            <ul className="mt-2 space-y-1">
              <li>• Memeriksa koneksi internet Anda</li>
              <li>• Memuat ulang halaman</li>
              <li>• Kembali ke halaman sebelumnya</li>
              <li>• Menghubungi tim support jika masalah berlanjut</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            {showRetry && onRetry && (
              <Button variant="outline" className="flex-1" onClick={onRetry}>
                Coba Lagi
              </Button>
            )}
            <Button variant="outline" className="flex-1" asChild>
              <Link href="javascript:history.back()">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Link>
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
