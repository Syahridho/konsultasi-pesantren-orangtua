"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccessControlExample() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Memuat sesi...</div>;
  }

  const userRole = session?.user.role;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pengguna</CardTitle>
          <CardDescription>
            Detail informasi pengguna yang sedang login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Nama:</strong> {session?.user?.name}
            </p>
            <p>
              <strong>Email:</strong> {session?.user?.email}
            </p>
            <p>
              <strong>Role:</strong>{" "}
              <span className="font-bold text-blue-600">{userRole}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontrol Akses Berdasarkan Role</CardTitle>
          <CardDescription>
            Tombol dan fitur yang tersedia berdasarkan role pengguna
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Admin Only */}
          {userRole === "admin" && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="font-semibold text-red-800 mb-2">Akses Admin</h3>
              <div className="space-y-2">
                <Button variant="destructive" className="w-full">
                  Kelola Pengguna (Admin Only)
                </Button>
                <Button variant="outline" className="w-full">
                  Laporan Sistem
                </Button>
                <Button variant="outline" className="w-full">
                  Pengaturan Aplikasi
                </Button>
              </div>
            </div>
          )}

          {/* Ustad or Admin */}
          {(userRole === "ustad" || userRole === "admin") && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-800 mb-2">Akses Ustad</h3>
              <div className="space-y-2">
                <Button variant="default" className="w-full">
                  Input Materi Pembelajaran
                </Button>
                <Button variant="outline" className="w-full">
                  Kelola Jadwal Kegiatan
                </Button>
                <Button variant="outline" className="w-full">
                  Lihat Progress Santri
                </Button>
              </div>
            </div>
          )}

          {/* Orang Tua */}
          {userRole === "orangtua" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-blue-800 mb-2">
                Akses Orang Tua
              </h3>
              <div className="space-y-2">
                <Button variant="default" className="w-full">
                  Lihat Laporan Anak
                </Button>
                <Button variant="outline" className="w-full">
                  Jadwal Kegiatan Anak
                </Button>
                <Button variant="outline" className="w-full">
                  Komunikasi dengan Ustad
                </Button>
              </div>
            </div>
          )}

          {/* No access or not logged in */}
          {!userRole && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="font-semibold text-gray-800 mb-2">
                Tidak Ada Akses
              </h3>
              <p className="text-gray-600">
                Anda tidak memiliki role yang valid atau belum login.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contoh Implementasi Kondisional</CardTitle>
          <CardDescription>
            Berbagai cara implementasi kontrol akses berdasarkan role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Multiple roles check */}
          {(userRole === "admin" || userRole === "ustad") && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm">
                ✅ Anda memiliki akses ke fitur manajemen konten (Admin & Ustad)
              </p>
            </div>
          )}

          {/* Single role check */}
          {userRole === "admin" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm">
                🔒 Hanya Admin yang bisa melihat pesan ini
              </p>
            </div>
          )}

          {/* Role-based content rendering */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <p className="text-sm mb-2">Konten berdasarkan role:</p>
            {userRole === "admin" && <p>• Dashboard Admin Lengkap</p>}
            {userRole === "ustad" && <p>• Dashboard Ustad</p>}
            {userRole === "orangtua" && <p>• Dashboard Orang Tua</p>}
            {!userRole && <p>• Silakan login terlebih dahulu</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
