import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/firebase-auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const success = await resetPassword(email);

    if (success) {
      return NextResponse.json(
        { message: "Password reset email sent successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to send password reset email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Password reset API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
