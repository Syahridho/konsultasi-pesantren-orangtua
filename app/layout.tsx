import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MetadataProvider } from "@/components/providers/metadata-provider";
import { Toaster } from "sonner";
import { generateMetadata as generateSiteMetadata } from "@/lib/metadata";
import { ErrorBoundary } from "@/components/error";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate metadata - will use default settings initially
// Settings from Firebase will be applied on client side for dynamic updates
export const metadata: Metadata = generateSiteMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <SessionProviderWrapper>
            <ThemeProvider>
              <MetadataProvider />
              {children}
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </SessionProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
