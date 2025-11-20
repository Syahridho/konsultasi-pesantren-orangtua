import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ref, get, update, remove, push, set } from "firebase/database";
import { database } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: santriId } = await params;

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow orangtua to access their own santri data
    if (userData.role !== "orangtua") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try NEW FORMAT first: santri as separate user
    const santriUserRef = ref(database, `users/${santriId}`);
    const santriUserSnapshot = await get(santriUserRef);

    if (santriUserSnapshot.exists()) {
      const santriData = santriUserSnapshot.val();
      
      // Verify this santri belongs to current parent
      if (santriData.parentId === session.user.id) {
        return NextResponse.json({
          santri: santriData,
        });
      }
    }

    // Fallback to OLD FORMAT: embedded santri data
    const santriEmbeddedRef = ref(
      database,
      `users/${session.user.id}/santri/${santriId}`
    );
    const santriEmbeddedSnapshot = await get(santriEmbeddedRef);

    if (santriEmbeddedSnapshot.exists()) {
      const santriData = santriEmbeddedSnapshot.val();
      return NextResponse.json({
        santri: {
          id: santriId,
          ...santriData,
        },
      });
    }

    return NextResponse.json({ error: "Santri not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching santri details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: santriId } = await params;
    const { santriData, studentData } = await request.json();
    const data = santriData || studentData; // Support both field names

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow orangtua to update their own santri data
    if (userData.role !== "orangtua") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!data.name || !data.tanggalLahir) {
      return NextResponse.json(
        { error: "Santri name and birth date are required" },
        { status: 400 }
      );
    }

    // Try NEW FORMAT first: santri as separate user
    const santriUserRef = ref(database, `users/${santriId}`);
    const santriUserSnapshot = await get(santriUserRef);

    if (santriUserSnapshot.exists()) {
      const santriData = santriUserSnapshot.val();
      
      // Verify this santri belongs to current parent
      if (santriData.parentId === session.user.id) {
        const updateData = {
          name: data.name,
          nis: data.nis || "",
          entryYear: data.tahunDaftar || new Date().getFullYear().toString(),
          gender: data.gender || "",
          tempatLahir: data.tempatLahir || "",
          tanggalLahir: data.tanggalLahir,
          updatedAt: new Date().toISOString(),
        };

        await update(santriUserRef, updateData);

        return NextResponse.json({
          message: "Santri updated successfully",
          santri: {
            ...santriData,
            ...updateData,
          },
        });
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Fallback to OLD FORMAT: embedded santri data
    const santriEmbeddedRef = ref(
      database,
      `users/${session.user.id}/santri/${santriId}`
    );
    const santriEmbeddedSnapshot = await get(santriEmbeddedRef);

    if (santriEmbeddedSnapshot.exists()) {
      const updateData = {
        name: data.name,
        nis: data.nis || "",
        tahunDaftar: data.tahunDaftar || new Date().getFullYear().toString(),
        gender: data.gender || "",
        tempatLahir: data.tempatLahir || "",
        tanggalLahir: data.tanggalLahir,
        updatedAt: new Date().toISOString(),
      };

      await update(santriEmbeddedRef, updateData);

      return NextResponse.json({
        message: "Santri updated successfully",
        santri: {
          id: santriId,
          ...updateData,
        },
      });
    }

    return NextResponse.json({ error: "Santri not found" }, { status: 404 });
  } catch (error) {
    console.error("Error updating santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: santriId } = await params;

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow orangtua to delete their own santri data
    if (userData.role !== "orangtua") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try NEW FORMAT first: santri as separate user
    const santriUserRef = ref(database, `users/${santriId}`);
    const santriUserSnapshot = await get(santriUserRef);

    if (santriUserSnapshot.exists()) {
      const santriData = santriUserSnapshot.val();
      
      // Verify this santri belongs to current parent
      if (santriData.parentId === session.user.id) {
        // Delete santri user
        await remove(santriUserRef);

        // Remove from parent's studentIds
        const currentStudentIds = userData.studentIds || [];
        const updatedStudentIds = currentStudentIds.filter((id: string) => id !== santriId);
        
        await update(userRef, {
          studentIds: updatedStudentIds,
          updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          message: "Santri deleted successfully",
          santriId,
        });
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Fallback to OLD FORMAT: embedded santri data
    const santriEmbeddedRef = ref(
      database,
      `users/${session.user.id}/santri/${santriId}`
    );
    const santriEmbeddedSnapshot = await get(santriEmbeddedRef);

    if (santriEmbeddedSnapshot.exists()) {
      await remove(santriEmbeddedRef);

      return NextResponse.json({
        message: "Santri deleted successfully",
        santriId,
      });
    }

    return NextResponse.json({ error: "Santri not found" }, { status: 404 });
  } catch (error) {
    console.error("Error deleting santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { santriData, studentData } = await request.json();
    const data = santriData || studentData; // Support both field names

    // Get current user's data from Firebase
    const userRef = ref(database, `users/${session.user.id}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snapshot.val();

    // Only allow orangtua to add their own santri data
    if (userData.role !== "orangtua") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!data.name || !data.tanggalLahir) {
      return NextResponse.json(
        { error: "Santri name and birth date are required" },
        { status: 400 }
      );
    }

    // NEW FORMAT: Create santri as a separate user in root users/
    const usersRef = ref(database, `users`);
    const newSantriRef = push(usersRef);
    const newSantriId = newSantriRef.key!;

    const newSantriData = {
      id: newSantriId,
      name: data.name,
      email: `santri_${newSantriId}@pesantren.local`, // Dummy email for display
      role: "santri",
      nis: data.nis || "",
      entryYear: data.tahunDaftar || new Date().getFullYear().toString(),
      status: "active",
      phone: "",
      gender: data.gender || "",
      tempatLahir: data.tempatLahir || "",
      tanggalLahir: data.tanggalLahir,
      parentId: session.user.id, // Link to parent
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save santri to database as separate user
    await set(newSantriRef, newSantriData);

    // Update parent's studentIds array
    const currentStudentIds = userData.studentIds || [];
    const updatedStudentIds = [...currentStudentIds, newSantriId];
    
    await update(userRef, {
      studentIds: updatedStudentIds,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Santri added successfully",
      santri: newSantriData,
      santriId: newSantriId,
    });
  } catch (error) {
    console.error("Error adding santri:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
