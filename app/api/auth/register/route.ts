import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/firebase-auth";
import { secondaryAuth } from "@/lib/firebase-secondary";

export async function POST(request: NextRequest) {
  try {
    const { parentName, email, password, role, students } =
      await request.json();

    // Validate input
    if (!parentName || !email || !password) {
      return NextResponse.json(
        { error: "Nama orang tua, email, dan password harus diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: "Data murid harus diisi" },
        { status: 400 }
      );
    }

    // Validate all student data
    for (const student of students) {
      if (
        !student.name ||
        !student.nis ||
        !student.tahunDaftar ||
        !student.gender ||
        !student.tempatLahir ||
        !student.tanggalLahir
      ) {
        return NextResponse.json(
          { error: "Semua data murid harus lengkap" },
          { status: 400 }
        );
      }
    }

    // Register user with parent and student data using secondary auth
    // This prevents the current admin from being logged out
    const user = await registerUser(
      email,
      password,
      parentName,
      role,
      students,
      secondaryAuth
    );

    if (!user) {
      return NextResponse.json(
        { error: "Registrasi gagal, email mungkin sudah digunakan" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Registrasi berhasil", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
