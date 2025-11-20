"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddOrangtuaModal from "@/components/dashboard/orangtua/add-orangtua-modal";
import { 
  Users,
  Search,
  Mail,
  Phone,
  Eye,
  UserCircle,
  UserPlus
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Type definitions
interface OrangTua {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  studentIds?: string[];
  students?: any[];
  santri?: any;
  createdAt?: string;
}

export default function OrangtuaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orangTuaList, setOrangTuaList] = useState<OrangTua[]>([]);
  const [filteredList, setFilteredList] = useState<OrangTua[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // Allow admin and ustad to access
    if (session.user.role !== "admin" && session.user.role !== "ustad") {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [session, status, router]);

  useEffect(() => {
    const filtered = orangTuaList.filter(
      (orangtua) =>
        orangtua.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orangtua.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orangtua.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredList(filtered);
  }, [orangTuaList, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get all users from Realtime Database
      const usersRef = ref(database, "users");
      const usersSnapshot = await get(usersRef);

      if (!usersSnapshot.exists()) {
        toast.info("Belum ada data orang tua");
        setLoading(false);
        return;
      }

      const allUsers = usersSnapshot.val();
      const orangtuaData: OrangTua[] = [];

      // Filter users with role orangtua
      Object.keys(allUsers).forEach((userId) => {
        const user = allUsers[userId];
        if (user.role === "orangtua") {
          // Count santri
          let santriCount = 0;
          if (user.studentIds && Array.isArray(user.studentIds)) {
            santriCount = user.studentIds.length;
          } else if (user.students && Array.isArray(user.students)) {
            santriCount = user.students.length;
          } else if (user.santri && typeof user.santri === "object") {
            santriCount = Object.keys(user.santri).length;
          }

          orangtuaData.push({
            id: userId,
            name: user.name || "Tidak ada nama",
            email: user.email || "Tidak ada email",
            phone: user.phone || "-",
            role: user.role,
            studentIds: user.studentIds,
            students: user.students,
            santri: user.santri,
            createdAt: user.createdAt,
          });
        }
      });

      // Sort by name
      orangtuaData.sort((a, b) => a.name.localeCompare(b.name));

      setOrangTuaList(orangtuaData);
      console.log(`[ORANGTUA PAGE] Loaded ${orangtuaData.length} orang tua`);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const getSantriCount = (orangtua: OrangTua) => {
    if (orangtua.studentIds && Array.isArray(orangtua.studentIds)) {
      return orangtua.studentIds.length;
    }
    if (orangtua.students && Array.isArray(orangtua.students)) {
      return orangtua.students.length;
    }
    if (orangtua.santri && typeof orangtua.santri === "object") {
      return Object.keys(orangtua.santri).length;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Data Orang Tua
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola semua data orang tua santri
            </p>
          </div>

          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Orang Tua
          </Button>
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orangTuaList.length}</p>
                <p className="text-xs text-muted-foreground">Total Orang Tua</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Orang Tua
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, email, atau telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tidak ada orang tua yang cocok dengan pencarian"
                  : "Belum ada data orang tua"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Nama</TableHead>
                    <TableHead className="w-[200px]">Email</TableHead>
                    <TableHead className="w-[150px]">Telepon</TableHead>
                    <TableHead className="text-center w-[100px]">Jumlah Santri</TableHead>
                    <TableHead className="w-[150px]">Terdaftar Sejak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((orangtua) => (
                    <TableRow key={orangtua.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="w-5 h-5 text-primary" />
                          </div>
                          {orangtua.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{orangtua.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          {orangtua.phone || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-medium">
                          {getSantriCount(orangtua)} Santri
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {orangtua.createdAt
                          ? new Date(orangtua.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {filteredList.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Menampilkan {filteredList.length} dari {orangTuaList.length} orang tua
              {searchTerm && ` untuk pencarian "${searchTerm}"`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Orangtua Modal */}
      <AddOrangtuaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
