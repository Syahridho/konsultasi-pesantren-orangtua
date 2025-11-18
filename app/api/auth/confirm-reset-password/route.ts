import { NextRequest, NextResponse } from "next/server";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { oobCode, password } = await request.json();

    if (!oobCode || !password) {
      return NextResponse.json(
        { error: "Reset code and password are required" },
        { status: 400 }
      );
    }

    await confirmPasswordReset(auth, oobCode, password);

    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Password reset confirmation error:", error);

    let errorMessage = "Failed to reset password";

    if (error.code === "auth/expired-action-code") {
      errorMessage = "Link reset password telah kadaluarsa";
    } else if (error.code === "auth/invalid-action-code") {
      errorMessage = "Link reset password tidak valid";
    } else if (error.code === "auth/user-disabled") {
      errorMessage = "Akun pengguna telah dinonaktifkan";
    } else if (error.code === "auth/user-not-found") {
      errorMessage = "Pengguna tidak ditemukan";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password terlalu lemah, minimal 6 karakter";
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
