"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";

interface StudentData {
  name: string;
  nis: string;
  tahunDaftar: string;
  gender: string;
  tempatLahir: string;
  tanggalLahir: string;
}

interface AddOrangtuaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddOrangtuaModal({
  isOpen,
  onClose,
  onSuccess,
}: AddOrangtuaModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Parent data (Step 1)
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const role = "orangtua";

  // Student data (Step 2)
  const [students, setStudents] = useState<StudentData[]>([
    {
      name: "",
      nis: "",
      tahunDaftar: new Date().getFullYear().toString(),
      gender: "",
      tempatLahir: "",
      tanggalLahir: "",
    },
  ]);

  const handleClose = () => {
    // Reset form
    setCurrentStep(1);
    setParentName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setStudents([
      {
        name: "",
        nis: "",
        tahunDaftar: new Date().getFullYear().toString(),
        gender: "",
        tempatLahir: "",
        tanggalLahir: "",
      },
    ]);
    setError("");
    onClose();
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate parent data
    if (!parentName.trim()) {
      setError("Nama orang tua harus diisi");
      return;
    }

    if (!email.trim()) {
      setError("Email harus diisi");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    setCurrentStep(2);
  };

  const handleAddStudent = () => {
    setStudents([
      ...students,
      {
        name: "",
        nis: "",
        tahunDaftar: new Date().getFullYear().toString(),
        gender: "",
        tempatLahir: "",
        tanggalLahir: "",
      },
    ]);
  };

  const handleRemoveStudent = (index: number) => {
    if (students.length > 1) {
      const newStudents = students.filter((_, i) => i !== index);
      setStudents(newStudents);
    }
  };

  const handleStudentChange = (
    index: number,
    field: keyof StudentData,
    value: string
  ) => {
    const newStudents = [...students];
    newStudents[index] = {
      ...newStudents[index],
      [field]: value,
    };
    setStudents(newStudents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate all student fields are filled
    const isAnyStudentIncomplete = students.some(
      (student) =>
        !student.name ||
        !student.nis ||
        !student.tahunDaftar ||
        !student.gender ||
        !student.tempatLahir ||
        !student.tanggalLahir
    );

    if (isAnyStudentIncomplete) {
      setError("Mohon lengkapi semua data santri");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/auth/register", {
        parentName,
        email,
        password,
        role,
        students,
      });

      if (response.status === 201) {
        toast.success("Orang tua berhasil ditambahkan");
        handleClose();
        onSuccess();
      } else {
        setError(response.data.error || "Terjadi kesalahan saat menambahkan");
      }
    } catch (error: any) {
      console.error("Error adding parent:", error);
      setError(
        error.response?.data?.error ||
          "Terjadi kesalahan saat menambahkan orang tua"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="parentName">
          Nama Orang Tua <span className="text-red-500">*</span>
        </Label>
        <Input
          id="parentName"
          type="text"
          placeholder="Masukkan nama lengkap orang tua"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Nomor Telepon</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="08123456789"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Masukkan password (minimal 6 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Konfirmasi Password <span className="text-red-500">*</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Konfirmasi password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
          Batal
        </Button>
        <Button type="submit" className="flex-1">
          Lanjut ke Data Santri
        </Button>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Data Santri</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStudent}
          >
            + Tambah Santri
          </Button>
        </div>

        {students.map((student, index) => (
          <Card key={index} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Santri {index + 1}</h4>
              {students.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveStudent(index)}
                >
                  Hapus
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`studentName-${index}`}>
                  Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`studentName-${index}`}
                  type="text"
                  placeholder="Masukkan nama lengkap santri"
                  value={student.name}
                  onChange={(e) =>
                    handleStudentChange(index, "name", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`nis-${index}`}>
                  NIS <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`nis-${index}`}
                  type="text"
                  placeholder="Masukkan NIS"
                  value={student.nis}
                  onChange={(e) =>
                    handleStudentChange(index, "nis", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`tahunDaftar-${index}`}>
                  Tahun Daftar <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`tahunDaftar-${index}`}
                  type="text"
                  placeholder="Masukkan tahun daftar"
                  value={student.tahunDaftar}
                  onChange={(e) =>
                    handleStudentChange(index, "tahunDaftar", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`gender-${index}`}>
                  Jenis Kelamin <span className="text-red-500">*</span>
                </Label>
                <select
                  id={`gender-${index}`}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={student.gender}
                  onChange={(e) =>
                    handleStudentChange(index, "gender", e.target.value)
                  }
                  required
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`tempatLahir-${index}`}>
                  Tempat Lahir <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`tempatLahir-${index}`}
                  type="text"
                  placeholder="Masukkan tempat lahir"
                  value={student.tempatLahir}
                  onChange={(e) =>
                    handleStudentChange(index, "tempatLahir", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`tanggalLahir-${index}`}>
                  Tanggal Lahir <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`tanggalLahir-${index}`}
                  type="date"
                  value={student.tanggalLahir}
                  onChange={(e) =>
                    handleStudentChange(index, "tanggalLahir", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setCurrentStep(1)}
        >
          Kembali
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Tambah Orang Tua Baru
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1
              ? "Lengkapi data orang tua untuk membuat akun baru"
              : "Lengkapi data santri yang terdaftar"}
          </DialogDescription>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div
              className={`h-2 w-8 rounded-full ${
                currentStep >= 1 ? "bg-primary" : "bg-gray-300"
              }`}
            />
            <div
              className={`h-2 w-8 rounded-full ${
                currentStep >= 2 ? "bg-primary" : "bg-gray-300"
              }`}
            />
          </div>
        </DialogHeader>

        <div className="mt-4">
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
