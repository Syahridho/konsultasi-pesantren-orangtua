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

interface ParentData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

interface StudentData {
  name: string;
  nis?: string;
  tahunDaftar: string;
  gender: "L" | "P" | "";
  tempatLahir?: string;
  tanggalLahir: string;
}

interface FormValues {
  parent: ParentData;
  student: StudentData;
}

interface AddMuridModalProps {
  onMuridAdded?: () => void;
}

export function AddMuridModal({ onMuridAdded }: AddMuridModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      parent: {
        name: "",
        email: "",
        phone: "",
        password: "",
      },
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
    if (!values.parent.name || values.parent.name.length < 3) {
      toast.error("Nama orang tua minimal 3 karakter");
      return;
    }

    if (!values.parent.email || !values.parent.email.includes("@")) {
      toast.error("Email tidak valid");
      return;
    }

    if (!values.parent.password || values.parent.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

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
      await axios.post("/api/murids/add", {
        parentData: values.parent,
        studentData: values.student,
      });

      toast.success("Murid berhasil ditambahkan");
      form.reset();
      setOpen(false);
      if (onMuridAdded) {
        onMuridAdded();
      }
    } catch (error: any) {
      console.error("Error adding murid:", error);
      toast.error(
        "Gagal menambahkan murid: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Murid
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Murid Baru</DialogTitle>
          <DialogDescription>
            Tambahkan data murid baru beserta informasi orang tua
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Parent Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Orang Tua</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parent.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama orang tua" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Telepon (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="0812-3456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent.password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Minimal 6 karakter"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Password untuk akun orang tua (minimal 6 karakter)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Student Information Section */}
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
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
