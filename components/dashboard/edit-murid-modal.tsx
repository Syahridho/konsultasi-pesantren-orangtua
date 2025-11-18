"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface StudentData {
  name: string;
  nis?: string;
  tahunDaftar: string;
  gender: "L" | "P" | "";
  tempatLahir?: string;
  tanggalLahir: string;
}

interface MuridDetails {
  id: string;
  userId: string;
  studentId: string;
  name: string;
  email: string;
  age: number;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  registrationDate: string;
  status: "active" | "inactive";
  nis?: string;
  gender?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
}

interface FormValues {
  student: StudentData;
}

interface EditMuridModalProps {
  muridId: string;
  trigger?: React.ReactNode;
  onMuridUpdated?: () => void;
}

export function EditMuridModal({
  muridId,
  trigger,
  onMuridUpdated,
}: EditMuridModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [murid, setMurid] = useState<MuridDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      student: {
        name: "",
        nis: "",
        tahunDaftar: new Date().getFullYear().toString(),
        gender: "",
        tempatLahir: "",
        tanggalLahir: "",
      },
    },
  });

  const fetchMuridDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/murids/${muridId}`);

      if (response.status === 200) {
        setMurid(response.data.murid);
        // Reset form with murid data
        form.reset({
          student: {
            name: response.data.murid.name || "",
            nis: response.data.murid.nis || "",
            tahunDaftar:
              response.data.murid.registrationDate?.split("-")[0] ||
              new Date().getFullYear().toString(),
            gender: response.data.murid.gender || "",
            tempatLahir: response.data.murid.tempatLahir || "",
            tanggalLahir: response.data.murid.tanggalLahir || "",
          },
        });
      } else {
        console.error("Failed to fetch murid details:", response.data.error);
      }
    } catch (error: any) {
      console.error("Error fetching murid details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMuridDetails();
    }
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    // Basic validation
    if (!values.student.name || values.student.name.length < 3) {
      toast.error("Nama murid minimal 3 karakter");
      return;
    }

    if (!values.student.tanggalLahir) {
      toast.error("Tanggal lahir harus diisi");
      return;
    }

    if (!values.student.gender) {
      toast.error("Pilih jenis kelamin");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put(`/api/murids/${muridId}`, {
        studentData: values.student,
      });

      if (response.status === 200) {
        toast.success("Data murid berhasil diperbarui");
        setOpen(false);
        if (onMuridUpdated) {
          onMuridUpdated();
        }
      } else {
        toast.error("Gagal memperbarui data murid: " + response.data.error);
      }
    } catch (error: any) {
      console.error("Error updating murid:", error);
      toast.error("Terjadi kesalahan saat memperbarui data murid");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Murid</DialogTitle>
          <DialogDescription>Perbarui informasi data murid</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p>Memuat data...</p>
          </div>
        ) : murid ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Murid</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="student.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama murid" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.nis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIS (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nomor Induk Siswa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.tahunDaftar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun Daftar</FormLabel>
                        <FormControl>
                          <Input placeholder="2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Kelamin</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="">Pilih jenis kelamin</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.tempatLahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempat Lahir (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Kota kelahiran" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.tanggalLahir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p>Data tidak ditemukan</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
