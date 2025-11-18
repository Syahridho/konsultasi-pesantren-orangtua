import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import UstadDashboard from "@/components/dashboard/UstadDashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  Calendar,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role || "orangtua";

  const getRoleSpecificContent = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard />;

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Menunggu Persetujuan
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.admin.pendingApprovals}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Permintaan ustadz baru
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Konsultasi
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.admin.totalConsultations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% dari bulan lalu
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pertumbuhan Bulanan
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    +{data.admin.monthlyGrowth}%
                  </div>
                  <p className="text-xs text-muted-foreground">Pengguna baru</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                  <CardDescription>
                    Tindakan admin yang sering dilakukan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/dashboard/approvals">
                    <Button className="w-full justify-start">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Kelola Persetujuan Ustadz
                    </Button>
                  </Link>
                  <Link href="/dashboard/santri/semua">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Kelola Data Santri
                    </Button>
                  </Link>
                  <Link href="/dashboard/ustad">
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Kelola Data Ustadz
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistik Terkini</CardTitle>
                  <CardDescription>Overview aktivitas sistem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Registrasi hari ini</span>
                      <Badge variant="secondary">3</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Konsultasi aktif</span>
                      <Badge variant="secondary">8</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ustadz online</span>
                      <Badge variant="secondary">12</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "ustad":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Dashboard Ustadz</h1>
              <Badge variant="default" className="text-sm">
                Ustadz
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Murid
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.ustad.totalStudents}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aktif bulan ini
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Konsultasi Aktif
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.ustad.activeConsultations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sedang berlangsung
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Selesai</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.ustad.completedConsultations}
                  </div>
                  <p className="text-xs text-muted-foreground">Total selesai</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jadwal</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.ustad.upcomingSessions}
                  </div>
                  <p className="text-xs text-muted-foreground">Hari ini</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                  <CardDescription>
                    Tindakan ustadz yang sering dilakukan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/dashboard/konsultasi">
                    <Button className="w-full justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Mulai Konsultasi Baru
                    </Button>
                  </Link>
                  <Link href="/dashboard/santri/semua">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Lihat Daftar Santri
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Jadwal Hari Ini</CardTitle>
                  <CardDescription>Konsultasi yang dijadwalkan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Ahmad Rizki</p>
                        <p className="text-sm text-gray-500">10:00 - 11:00</p>
                      </div>
                      <Badge variant="outline">Menunggu</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Siti Nurhaliza</p>
                        <p className="text-sm text-gray-500">14:00 - 15:00</p>
                      </div>
                      <Badge variant="outline">Menunggu</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "orangtua":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Dashboard Orang Tua</h1>
              <Badge variant="default" className="text-sm">
                Orang Tua
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Anak
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.orangtua.totalChildren}
                  </div>
                  <p className="text-xs text-muted-foreground">Terdaftar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Konsultasi Aktif
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.orangtua.activeConsultations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sedang berlangsung
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Riwayat</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.orangtua.consultationHistory}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total konsultasi
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jadwal</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.orangtua.upcomingSessions}
                  </div>
                  <p className="text-xs text-muted-foreground">Hari ini</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                  <CardDescription>
                    Tindakan orang tua yang sering dilakukan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/dashboard/konsultasi">
                    <Button className="w-full justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ajukan Konsultasi Baru
                    </Button>
                  </Link>
                  <Link href="/dashboard/santri/orangtua">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Kelola Data Santri
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Konsultasi Terakhir</CardTitle>
                  <CardDescription>Riwayat konsultasi anak</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Muhammad Ali</p>
                        <p className="text-sm text-gray-500">
                          Ustadz Ahmad - 2 hari lalu
                        </p>
                      </div>
                      <Badge variant="outline">Selesai</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Fatimah Zahra</p>
                        <p className="text-sm text-gray-500">
                          Ustadz Budi - 1 minggu lalu
                        </p>
                      </div>
                      <Badge variant="outline">Selesai</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div>Role tidak dikenali</div>;
    }
  };

  return <div className="container mx-auto">{getRoleSpecificContent()}</div>;
}
