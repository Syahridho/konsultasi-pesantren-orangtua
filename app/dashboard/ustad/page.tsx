"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, Plus } from "lucide-react";
import { ViewUstadModal } from "@/components/dashboard/ustad/view-ustad-modal";
import { EditUstadModal } from "@/components/dashboard/ustad/edit-ustad-modal";
import { DeleteUstadModal } from "@/components/dashboard/ustad/delete-ustad-modal";
import { AddUstadModal } from "@/components/dashboard/add-ustad-modal";
import api from "@/lib/api";

interface Ustad {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export default function UstadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ustadList, setUstadList] = useState<Ustad[]>([]);
  const [filteredUstadList, setFilteredUstadList] = useState<Ustad[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "admin") {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      router.push("/dashboard");
      return;
    }

    fetchUstad();
  }, [session, status, router]);

  useEffect(() => {
    fetchUstad();
  }, []);

  useEffect(() => {
    const filtered = ustadList.filter(
      (ustad) =>
        ustad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ustad.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ustad.phone &&
          ustad.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUstadList(filtered);
  }, [ustadList, searchTerm]);

  const fetchUstad = async () => {
    try {
      const response = await api.get("/api/ustads");

      if (response.status === 200) {
        setUstadList(response.data.ustadList || []);
      } else {
        toast.error("Gagal memuat data ustad: " + response.data.error);
      }
    } catch (error: any) {
      console.error("Error fetching ustad:", error);
      toast.error("Terjadi kesalahan saat memuat data ustad");
    } finally {
      setLoading(false);
    }
  };

  const handleUstadAdded = () => {
    fetchUstad();
    toast.success("Ustad berhasil ditambahkan");
  };

  const handleUstadUpdated = () => {
    fetchUstad();
    toast.success("Data ustad berhasil diperbarui");
  };

  const handleUstadDeleted = () => {
    fetchUstad();
    toast.success("Ustad berhasil dihapus");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Ustad</h1>
          <p className="text-muted-foreground">Kelola data ustad/pengajar</p>
        </div>
        <AddUstadModal onUstadAdded={handleUstadAdded} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Ustad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari ustad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredUstadList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Tidak ada ustad yang cocok dengan pencarian"
                  : "Belum ada data ustad"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUstadList.map((ustad) => (
                  <TableRow key={ustad.id}>
                    <TableCell className="font-medium">{ustad.name}</TableCell>
                    <TableCell>{ustad.email}</TableCell>
                    <TableCell>{ustad.phone || "-"}</TableCell>
                    <TableCell>{ustad.role}</TableCell>
                    <TableCell>{formatDate(ustad.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ViewUstadModal ustadId={ustad.id} />
                        <EditUstadModal
                          ustadId={ustad.id}
                          onUstadUpdated={handleUstadUpdated}
                        />
                        <DeleteUstadModal
                          ustadId={ustad.id}
                          ustadName={ustad.name}
                          onUstadDeleted={handleUstadDeleted}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
