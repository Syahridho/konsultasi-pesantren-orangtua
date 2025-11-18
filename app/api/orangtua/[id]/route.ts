import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, update, remove, push } from "firebase/database";
import { database } from "@/lib/firebase";

// GET individual orangtua by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "ustad") {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: orangtuaId } = await params;

    // Get orangtua data
    const orangtuaRef = ref(database, `users/${orangtuaId}`);
    const orangtuaSnapshot = await get(orangtuaRef);

    if (!orangtuaSnapshot.exists()) {
      return NextResponse.json(
        { error: "Orang tua not found" },
        { status: 404 }
      );
    }

    const orangtuaData = orangtuaSnapshot.val();

    if (orangtuaData.role !== "orangtua") {
      return NextResponse.json(
        { error: "User is not an orangtua" },
        { status: 400 }
      );
    }

    // Get santri data for this orangtua
    const santriList: any[] = [];
    if (orangtuaData.santri) {
      for (const [santriId, santriData] of Object.entries(
        orangtuaData.santri
      )) {
        santriList.push({
          id: santriId,
          ...(santriData as any),
        });
      }
    }

    const response = {
      orangtua: {
        id: orangtuaId,
        name: orangtuaData.name,
        email: orangtuaData.email,
        phone: orangtuaData.phone || null,
        role: orangtuaData.role,
        createdAt: orangtuaData.createdAt,
        santriList: santriList,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching orangtua:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update orangtua by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "ustad") {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: orangtuaId } = await params;
    const { orangtuaData, newSantriList } = await request.json();

    if (!orangtuaData) {
      return NextResponse.json(
        { error: "Orangtua data is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!orangtuaData.name || orangtuaData.name.length < 3) {
      return NextResponse.json(
        { error: "Name must be at least 3 characters long" },
        { status: 400 }
      );
    }

    if (!orangtuaData.email || !orangtuaData.email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if orangtua exists
    const orangtuaRef = ref(database, `users/${orangtuaId}`);
    const orangtuaSnapshot = await get(orangtuaRef);

    if (!orangtuaSnapshot.exists()) {
      return NextResponse.json(
        { error: "Orang tua not found" },
        { status: 404 }
      );
    }

    const existingData = orangtuaSnapshot.val();

    if (existingData.role !== "orangtua") {
      return NextResponse.json(
        { error: "User is not an orangtua" },
        { status: 400 }
      );
    }

    // Update orangtua data
    const updatedData = {
      ...existingData,
      name: orangtuaData.name,
      email: orangtuaData.email,
      phone: orangtuaData.phone || null,
      updatedAt: new Date().toISOString(),
    };

    // Add new santri data if provided
    if (newSantriList && newSantriList.length > 0) {
      const existingSantri = updatedData.santri || {};
      newSantriList.forEach((santri: any) => {
        const santriId = push(ref(database, `users/${orangtuaId}/santri`)).key;
        if (santriId) {
          existingSantri[santriId] = {
            name: santri.name,
            nis: santri.nis || "",
            tahunDaftar:
              santri.tahunDaftar || new Date().getFullYear().toString(),
            gender: santri.gender || "",
            tempatLahir: santri.tempatLahir || "",
            tanggalLahir: santri.tanggalLahir,
            createdAt: new Date().toISOString(),
          };
        }
      });
      (updatedData as any).santri = existingSantri;
    }

    await update(orangtuaRef, updatedData);

    return NextResponse.json({
      message: "Orang tua updated successfully",
      orangtua: {
        id: orangtuaId,
        ...updatedData,
      },
    });
  } catch (error) {
    console.error("Error updating orangtua:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE orangtua by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin" && session.user.role !== "ustad") {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: orangtuaId } = await params;

    // Check if orangtua exists
    const orangtuaRef = ref(database, `users/${orangtuaId}`);
    const orangtuaSnapshot = await get(orangtuaRef);

    if (!orangtuaSnapshot.exists()) {
      return NextResponse.json(
        { error: "Orang tua not found" },
        { status: 404 }
      );
    }

    const existingData = orangtuaSnapshot.val();

    if (existingData.role !== "orangtua") {
      return NextResponse.json(
        { error: "User is not an orangtua" },
        { status: 400 }
      );
    }

    // Delete orangtua
    await remove(orangtuaRef);

    return NextResponse.json({
      message: "Orang tua deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting orangtua:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
