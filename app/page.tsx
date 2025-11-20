"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import {
  BookOpen,
  MessageCircle,
  GraduationCap,
  Shield,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useSiteSettings } from "@/lib/hooks/useSiteSettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { settings, loading } = useSiteSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-secondary/5 py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            {loading ? (
              <>
                <Skeleton className="h-16 w-3/4 mx-auto mb-4" />
                <Skeleton className="h-12 w-1/2 mx-auto mb-6" />
                <Skeleton className="h-6 w-2/3 mx-auto mb-10" />
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
                  {settings.heroTitle}
                  <span className="block" style={{ color: settings.primaryColor }}>
                    {settings.heroSubtitle}
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                  {settings.siteDescription}
                </p>
              </>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                style={{ 
                  backgroundColor: settings.primaryColor,
                  color: 'white'
                }}
                className="hover:opacity-90 transition-opacity"
                asChild
              >
                <Link href="/register">Mulai Konsultasi</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#features">Pelajari Lebih Lanjut</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div 
          className="absolute top-20 left-10 w-20 h-20 rounded-full opacity-20 blur-xl"
          style={{ backgroundColor: settings.primaryColor }}
        ></div>
        <div 
          className="absolute bottom-20 right-10 w-32 h-32 rounded-full opacity-20 blur-xl"
          style={{ backgroundColor: settings.secondaryColor }}
        ></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fitur Unggulan Kami
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Solusi lengkap untuk memenuhi kebutuhan monitoring dan komunikasi
              di pesantren
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div 
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
                  style={{ 
                    backgroundColor: `${settings.primaryColor}20`,
                  }}
                >
                  <BookOpen className="w-7 h-7" style={{ color: settings.primaryColor }} />
                </div>
                <CardTitle className="text-xl">Monitoring Hafalan</CardTitle>
                <CardDescription>
                  Pantau progress hafalan santri secara real-time dengan detail
                  surah dan ayat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: settings.primaryColor }} />
                    Update harian otomatis
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: settings.primaryColor }} />
                    Grafik perkembangan visual
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: settings.primaryColor }} />
                    Notifikasi milestone
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature Card 2 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div 
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${settings.secondaryColor}20` }}
                >
                  <MessageCircle className="w-7 h-7" style={{ color: settings.secondaryColor }} />
                </div>
                <CardTitle className="text-xl">
                  Chat Konsultasi Ustadz
                </CardTitle>
                <CardDescription>
                  Komunikasi langsung antara orang tua dan ustadz untuk
                  konsultasi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: settings.secondaryColor }} />
                    Real-time messaging
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: settings.secondaryColor }} />
                    History percakapan tersimpan
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: settings.secondaryColor }} />
                    File sharing capability
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature Card 3 */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div 
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${settings.accentColor}20` }}
                >
                  <GraduationCap className="w-7 h-7" style={{ color: settings.accentColor }} />
                </div>
                <CardTitle className="text-xl">Laporan Akademik</CardTitle>
                <CardDescription>
                  Akses lengkap nilai dan prestasi akademik santri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: settings.accentColor }} />
                    Nilai semester terstruktur
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: settings.accentColor }} />
                    Analisis performa
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" style={{ color: settings.accentColor }} />
                    Export PDF reports
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust/About Section */}
      <section id="about" className="py-20 sm:py-32 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Mengapa PesantrenConnect Aman & Terpercaya?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${settings.primaryColor}20` }}
                  >
                    <Shield className="w-6 h-6" style={{ color: settings.primaryColor }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Keamanan Data Terjamin
                    </h3>
                    <p className="text-gray-600">
                      Data santri dan komunikasi dilindungi dengan enkripsi
                      end-to-end dan standar keamanan terkini.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${settings.secondaryColor}20` }}
                  >
                    <Users className="w-6 h-6" style={{ color: settings.secondaryColor }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Kolaborasi Efektif
                    </h3>
                    <p className="text-gray-600">
                      Platform yang memudahkan koordinasi antara ustadz, orang
                      tua, dan pengurus pesantren.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${settings.accentColor}20` }}
                  >
                    <Clock className="w-6 h-6" style={{ color: settings.accentColor }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Update Real-time
                    </h3>
                    <p className="text-gray-600">
                      Informasi perkembangan santri tersedia 24/7 dengan update
                      langsung dari ustadz pengampu.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${settings.secondaryColor}20` }}
                  >
                    <CheckCircle className="w-6 h-6" style={{ color: settings.secondaryColor }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Terverifikasi & Bersertifikat
                    </h3>
                    <p className="text-gray-600">
                      Platform telah digunakan oleh 50+ pesantren dengan
                      testimoni positif dari pengguna.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button
                size="lg"
                style={{ 
                  backgroundColor: settings.primaryColor,
                  color: 'white'
                }}
                className="hover:opacity-90 transition-opacity"
                asChild
              >
                <Link href="/register">Daftar Sekarang</Link>
              </Button>
              <p className="mt-4 text-sm text-gray-600">
                Gratis 30 hari untuk pesantren pendaftar pertama
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <span className="text-white font-bold text-lg">{settings.logoText}</span>
                </div>
                <span className="font-bold text-xl">{settings.siteName}</span>
              </div>
              <p className="text-gray-400 text-sm">
                © 2024 {settings.siteName}. All rights reserved.
              </p>
            </div>

            <div className="flex space-x-6">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Facebook
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Instagram
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
