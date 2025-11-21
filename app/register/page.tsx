"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/api";

interface StudentData {
  name: string;
  nis: string;
  tahunDaftar: string;
  gender: string;
  tempatLahir: string;
  tanggalLahir: string;
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Parent data (Step 1)
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role] = useState<"orangtua">("orangtua");

  // Student data (Step 2)
  const [students, setStudents] = useState<StudentData[]>([
    {
      name: "",
      nis: "",
      tahunDaftar: "",
      gender: "",
      tempatLahir: "",
      tanggalLahir: "",
    },
  ]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
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
        tahunDaftar: "",
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
      setError("Mohon lengkapi semua data murid");
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
        // Registration successful, redirect to login
        router.push("/login?message=Registrasi berhasil, silakan login");
      } else {
        setError(response.data.error || "Terjadi kesalahan saat registrasi");
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error || "Terjadi kesalahan saat registrasi"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="parentName">Nama Orang Tua</Label>
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
        <Label htmlFor="email">Email</Label>
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
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Konfirmasi password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" className="w-full">
        Lanjut ke Data Murid
      </Button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Data Murid/Santri</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStudent}
          >
            Tambah Murid
          </Button>
        </div>

        {students.map((student, index) => (
          <Card key={index} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Murid {index + 1}</h4>
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
                <Label htmlFor={`studentName-${index}`}>Nama Lengkap</Label>
                <Input
                  id={`studentName-${index}`}
                  type="text"
                  placeholder="Masukkan nama lengkap murid"
                  value={student.name}
                  onChange={(e) =>
                    handleStudentChange(index, "name", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`nis-${index}`}>NIS</Label>
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
                <Label htmlFor={`tahunDaftar-${index}`}>Tahun Daftar</Label>
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
                <Label htmlFor={`gender-${index}`}>Jenis Kelamin</Label>
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
                <Label htmlFor={`tempatLahir-${index}`}>Tempat Lahir</Label>
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
                <Label htmlFor={`tanggalLahir-${index}`}>Tanggal Lahir</Label>
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

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setCurrentStep(1)}
        >
          Kembali
        </Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? "Memuat..." : "Registrasi"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Registrasi</CardTitle>
          <CardDescription>
            {currentStep === 1
              ? "Buat akun baru untuk mengakses aplikasi"
              : "Lengkapi data murid/santri di pesantren"}
          </CardDescription>
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div
              className={`h-2 w-8 rounded-full ${
                currentStep >= 1 ? "bg-green-600" : "bg-gray-300"
              }`}
            />
            <div
              className={`h-2 w-8 rounded-full ${
                currentStep >= 2 ? "bg-green-600" : "bg-gray-300"
              }`}
            />
          </div>
        </CardHeader>
        <CardContent>
          {currentStep === 1 ? renderStep1() : renderStep2()}
          <div className="mt-4 text-center text-sm">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-green-600 hover:underline">
              Login di sini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
