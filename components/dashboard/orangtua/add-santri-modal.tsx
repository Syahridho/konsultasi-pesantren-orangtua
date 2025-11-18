"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface StudentData {
  name: string;
  nis?: string;
  tahunDaftar?: string;
  gender?: "L" | "P" | "";
  tempatLahir?: string;
  tanggalLahir?: string;
}

interface FormValues {
  student: StudentData;
}

interface AddSantriModalProps {
  trigger?: React.ReactNode;
  onSantriAdded?: () => void;
}

export function AddSantriModal({
  trigger,
  onSantriAdded,
}: AddSantriModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const onSubmit = async (values: FormValues) => {
    // Basic validation
    if (!values.student.name || values.student.name.length < 3) {
      toast.error("Nama santri minimal 3 karakter");
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
      const response = await axios.post("/api/orangtua/santri", {
        studentData: values.student,
      });

      toast.success("Santri berhasil ditambahkan");
      setOpen(false);
      form.reset();
      if (onSantriAdded) {
        onSantriAdded();
      }
    } catch (error: any) {
      console.error("Error adding santri:", error);
      toast.error(
        "Gagal menambahkan santri: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Santri
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Santri Baru</DialogTitle>
          <DialogDescription>
            Tambahkan data santri baru ke dalam sistem
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Santri</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="student.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama santri" {...field} />
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
                {isSubmitting ? "Menyimpan..." : "Tambah Santri"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
